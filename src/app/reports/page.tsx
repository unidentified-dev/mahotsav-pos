import { prisma } from '@/lib/prisma';
import ReportsViewClient from './ReportsViewClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const resolvedParams = await searchParams;
  const selectedRange = resolvedParams?.range || 'today';

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let filterDate = startOfDay;
  let rangeLabel = "Today's Settled Operations";

  if (selectedRange === 'week') {
    filterDate = sevenDaysAgo;
    rangeLabel = 'Last 7 Days (Weekly Summary)';
  } else if (selectedRange === 'month') {
    filterDate = thirtyDaysAgo;
    rangeLabel = 'Last 30 Days (Monthly Summary)';
  }

  // Fetch orders matching the time range
  const allOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: filterDate },
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

  // Settled bills: payment method recorded OR table is currently vacant
  const settledOrders = allOrders.filter(
    (o) => Boolean(o.paymentMethod) || o.table?.status === 'AVAILABLE'
  );

  let totalSales = 0;
  let totalFoodGst = 0;
  let totalLiquorVat = 0;
  let totalDiscounts = 0;

  let cashTotal = 0;
  let cardTotal = 0;
  let upiTotal = 0;

  let restoRevenue = 0;
  let barRevenue = 0;

  settledOrders.forEach((ord) => {
    const grand = Number(ord.grandTotal || 0);
    totalSales += grand;
    totalFoodGst += Number(ord.foodGst || 0);
    totalLiquorVat += Number(ord.liquorVat || 0);
    totalDiscounts += Number(ord.discountAmount || 0);

    const mode = String(ord.paymentMethod || '').toUpperCase();
    if (mode === 'CASH') cashTotal += grand;
    else if (mode === 'UPI') upiTotal += grand;
    else cardTotal += grand;

    (ord.items || []).forEach((it) => {
      const isBar =
        it.menuItem?.station === 'BAR' ||
        it.menuItem?.isAlcoholic === true ||
        ord.table?.section?.name?.toLowerCase().includes('bar');

      const amount = Number(it.unitPrice) * it.quantity;
      if (isBar) barRevenue += amount;
      else restoRevenue += amount;
    });
  });

  return (
    <ReportsViewClient
      selectedRange={selectedRange}
      rangeLabel={rangeLabel}
      totalSales={totalSales}
      totalFoodGst={totalFoodGst}
      totalLiquorVat={totalLiquorVat}
      totalDiscounts={totalDiscounts}
      restoRevenue={restoRevenue}
      barRevenue={barRevenue}
      cashTotal={cashTotal}
      cardTotal={cardTotal}
      upiTotal={upiTotal}
      settledOrders={JSON.parse(JSON.stringify(settledOrders))}
    />
  );
}