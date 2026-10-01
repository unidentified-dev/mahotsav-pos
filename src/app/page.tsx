import { prisma } from '@/lib/prisma';
import FloorViewClient from './components/FloorViewClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // 1. Fetch floor sections and tables with their latest running order
  const sections = await prisma.section.findMany({
    include: {
      tables: {
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, grandTotal: true },
          },
        },
        orderBy: { tableNumber: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  // 2. Fetch categories and active menu items
  const categories = await prisma.category.findMany({
    include: {
      items: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  // 3. Fetch inventory items
  const inventoryItems = await prisma.inventoryItem.findMany({
    orderBy: { currentStock: 'asc' },
  });

  // 4. Calculate accurate time windows
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all orders for historical & today analysis
  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
      table: {
        include: {
          section: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // A settled order has a payment method recorded OR its table has been vacated
  const isSettled = (ord: any) =>
    Boolean(ord.paymentMethod) || ord.table?.status === 'AVAILABLE';

  // Settle collections today
  const settledOrdersToday = recentOrders.filter(
    (ord) => new Date(ord.createdAt) >= startOfDay && isSettled(ord)
  );

  // Settle collections last 7 days
  const settledOrdersWeek = recentOrders.filter(
    (ord) => new Date(ord.createdAt) >= sevenDaysAgo && isSettled(ord)
  );

  // Settle collections last 30 days
  const settledOrdersMonth = recentOrders.filter((ord) => isSettled(ord));

  let totalRevenue = 0;
  let foodGstTotal = 0;
  let liquorVatTotal = 0;
  let discountTotal = 0;

  const restoItemMap: { [name: string]: { quantity: number; revenue: number } } = {};
  const barItemMap: { [name: string]: { quantity: number; revenue: number } } = {};

  settledOrdersToday.forEach((ord) => {
    totalRevenue += Number(ord.grandTotal || 0);
    foodGstTotal += Number(ord.foodGst || 0);
    liquorVatTotal += Number(ord.liquorVat || 0);
    discountTotal += Number(ord.discountAmount || 0);

    (ord.items || []).forEach((it) => {
      const rawName = it.menuItem?.name || 'Item';
      const cleanName = rawName.includes('::') ? rawName.split('::')[0].trim() : rawName;

      const isBar =
        it.menuItem?.station === 'BAR' ||
        it.menuItem?.isAlcoholic === true ||
        ord.table?.section?.name?.toLowerCase().includes('bar');

      const targetMap = isBar ? barItemMap : restoItemMap;
      const itemQty = Number(it.quantity) || 1;
      const itemPrice = Number(it.unitPrice) || 0;

      if (!targetMap[cleanName]) {
        targetMap[cleanName] = { quantity: 0, revenue: 0 };
      }
      targetMap[cleanName].quantity += itemQty;
      targetMap[cleanName].revenue += itemPrice * itemQty;
    });
  });

  const weekRevenue = settledOrdersWeek.reduce(
    (sum, ord) => sum + Number(ord.grandTotal || 0),
    0
  );
  const monthRevenue = settledOrdersMonth.reduce(
    (sum, ord) => sum + Number(ord.grandTotal || 0),
    0
  );

  const topRestoItems = Object.entries(restoItemMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topBarItems = Object.entries(barItemMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const financialStats = {
    totalRevenue,
    foodGstTotal,
    liquorVatTotal,
    discountTotal,
    orderCount: settledOrdersToday.length,
    topRestoItems,
    topBarItems,
    initialOnlineOrders: [
      {
        id: 'ZOM-8831',
        platform: 'ZOMATO',
        customerName: 'Priya Sharma',
        time: '12 mins ago',
        total: 620.0,
        status: 'NEW',
        items: ['2x Paneer Makhanwala', '4x Butter Roti', '1x Jeera Rice'],
      },
      {
        id: 'SWG-4412',
        platform: 'SWIGGY',
        customerName: 'Amit Patel',
        time: '24 mins ago',
        total: 480.0,
        status: 'PREPARING',
        items: ['1x Paneer Mushroom Masala', '3x Garlic Naan'],
      },
    ],
  };

  const estimatedCogs = totalRevenue * 0.32;
  const estimatedExpenses = totalRevenue > 0 ? 2800 : 0;
  const netProfit = totalRevenue - (foodGstTotal + liquorVatTotal) - estimatedCogs - estimatedExpenses;

  const lowStockItems = inventoryItems.filter(
    (i) => Number(i.currentStock) <= Number(i.minThreshold)
  );

  // Executive Owner Dashboard Summary derived from real queries
  const ownerSummary = {
    grossSalesToday: totalRevenue,
    grossSalesWeek: weekRevenue > 0 ? weekRevenue : totalRevenue,
    grossSalesMonth: monthRevenue > 0 ? monthRevenue : totalRevenue,
    netProfitToday: netProfit > 0 ? netProfit : 0,
    cogsAmount: estimatedCogs,
    taxesTotal: foodGstTotal + liquorVatTotal,
    expensesAmount: estimatedExpenses,
    orderCount: settledOrdersToday.length,
    lowStockCount: lowStockItems.length,
    inventory: {
      lowStockAlerts: lowStockItems,
    },
  };

  return (
    <FloorViewClient
      sections={JSON.parse(JSON.stringify(sections))}
      categories={JSON.parse(JSON.stringify(categories))}
      inventoryItems={JSON.parse(JSON.stringify(inventoryItems))}
      financialStats={financialStats}
      ownerSummary={ownerSummary}
    />
  );
}