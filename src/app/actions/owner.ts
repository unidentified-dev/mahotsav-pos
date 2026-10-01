'use server';

import { prisma } from '@/lib/prisma';

export async function getOwnerExecutiveSummary() {
  const now = new Date();
  
  // Date ranges
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

  // Fetch orders
  const allPaidOrders = await prisma.order.findMany({
    where: {
      status: 'PAID',
    },
    include: {
      items: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  // Calculate day metrics
  const dayOrders = allPaidOrders.filter((o) => new Date(o.createdAt) >= startOfDay);
  const dayRevenue = dayOrders.reduce((acc, o) => acc + Number(o.grandTotal || 0), 0);
  const dayFoodGst = dayOrders.reduce((acc, o) => acc + Number(o.foodGst || 0), 0);
  const dayLiquorVat = dayOrders.reduce((acc, o) => acc + Number(o.liquorVat || 0), 0);
  const dayDiscount = dayOrders.reduce((acc, o) => acc + Number(o.discountAmount || 0), 0);

  // Calculate week metrics
  const weekOrders = allPaidOrders.filter((o) => new Date(o.createdAt) >= startOfWeek);
  const weekRevenue = weekOrders.reduce((acc, o) => acc + Number(o.grandTotal || 0), 0);
  const weekFoodGst = weekOrders.reduce((acc, o) => acc + Number(o.foodGst || 0), 0);
  const weekLiquorVat = weekOrders.reduce((acc, o) => acc + Number(o.liquorVat || 0), 0);

  // Calculate month metrics
  const monthOrders = allPaidOrders.filter((o) => new Date(o.createdAt) >= startOfMonth);
  const monthRevenue = monthOrders.reduce((acc, o) => acc + Number(o.grandTotal || 0), 0);
  const monthFoodGst = monthOrders.reduce((acc, o) => acc + Number(o.foodGst || 0), 0);
  const monthLiquorVat = monthOrders.reduce((acc, o) => acc + Number(o.liquorVat || 0), 0);
  const monthDiscount = monthOrders.reduce((acc, o) => acc + Number(o.discountAmount || 0), 0);

  // Inventory and refilling notifications
  const rawMaterials = await prisma.inventoryItem.findMany({
    orderBy: { currentStock: 'asc' },
  });

  const lowStockAlerts = rawMaterials.filter(
    (i) => Number(i.currentStock) <= Number(i.minThreshold)
  );

  // Total inventory estimated purchase value
  const totalStockValuation = rawMaterials.reduce(
    (acc, i) => acc + Number(i.currentStock) * Number(i.costPerUnit || 0),
    0
  );

  // Estimated COGS & Net Profit Calculation (Industry standard: 32% food + liquor cost of goods)
  const estimatedCogsRate = 0.32;
  const estimatedMonthCogs = monthRevenue * estimatedCogsRate;
  const monthTotalTaxes = monthFoodGst + monthLiquorVat;
  const netBusinessProfit = monthRevenue - (estimatedMonthCogs + monthTotalTaxes + monthDiscount);
  const isProfitable = netBusinessProfit >= 0;
  const profitMargin = monthRevenue > 0 ? (netBusinessProfit / monthRevenue) * 100 : 0;

  return {
    day: {
      revenue: dayRevenue,
      ordersCount: dayOrders.length,
      foodGst: dayFoodGst,
      liquorVat: dayLiquorVat,
      discount: dayDiscount,
    },
    week: {
      revenue: weekRevenue,
      ordersCount: weekOrders.length,
      foodGst: weekFoodGst,
      liquorVat: weekLiquorVat,
    },
    month: {
      revenue: monthRevenue,
      ordersCount: monthOrders.length,
      foodGst: monthFoodGst,
      liquorVat: monthLiquorVat,
      discount: monthDiscount,
    },
    pnl: {
      grossRevenue: monthRevenue,
      estimatedCogs: estimatedMonthCogs,
      totalTaxes: monthTotalTaxes,
      discountsGiven: monthDiscount,
      netProfit: netBusinessProfit,
      isProfitable,
      profitMargin: profitMargin.toFixed(1),
    },
    inventory: {
      totalItems: rawMaterials.length,
      totalValuation: totalStockValuation,
      lowStockAlerts: JSON.parse(JSON.stringify(lowStockAlerts)),
      items: JSON.parse(JSON.stringify(rawMaterials)),
    },
  };
}