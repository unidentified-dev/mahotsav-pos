'use client';

import {
  TrendingUp,
  DollarSign,
  Receipt,
  PieChart,
  Boxes,
  FileSpreadsheet,
  AlertCircle,
  Share2,
} from 'lucide-react';

interface OwnerFinancialDashboardProps {
  stats: {
    totalRevenue: number;
    foodGstTotal: number;
    liquorVatTotal: number;
    discountTotal: number;
    orderCount: number;
    recentOrders: any[];
    supplierBillsTotal: number;
  };
  inventorySummary: {
    totalRestoItems: number;
    totalBarItems: number;
    lowStockCount: number;
  };
}

export default function OwnerFinancialDashboard({
  stats,
  inventorySummary,
}: OwnerFinancialDashboardProps) {
  const netEarnings = stats.totalRevenue - stats.supplierBillsTotal;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📊 *MAHOTSAV RESTOBAR - FINANCIAL REPORT*\n` +
      `📅 Date: ${new Date().toLocaleDateString('en-IN')}\n` +
      `--------------------------------\n` +
      `💰 *Total Revenue:* ₹${stats.totalRevenue.toFixed(2)}\n` +
      `📦 *Vendor Purchases:* ₹${stats.supplierBillsTotal.toFixed(2)}\n` +
      `📈 *Net Operating Balance:* ₹${netEarnings.toFixed(2)}\n` +
      `--------------------------------\n` +
      `🍴 *Food GST (5%):* ₹${stats.foodGstTotal.toFixed(2)}\n` +
      `🍾 *Liquor VAT (10%):* ₹${stats.liquorVatTotal.toFixed(2)}\n` +
      `🏷️ *Discounts Audited:* ₹${stats.discountTotal.toFixed(2)}\n` +
      `🧾 *Bills Settled:* ${stats.orderCount}\n` +
      `--------------------------------\n` +
      `Report automatically generated from Owner Terminal.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with WhatsApp Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#141b29] to-[#10141d] border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-teal-400" />
            Executive Financial & Profit Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time revenue, gross margin, tax compliance, and procurement ledger
          </p>
        </div>

        <button
          onClick={handleShareWhatsApp}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition"
        >
          <Share2 className="w-4 h-4" />
          Share Financials to WhatsApp
        </button>
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#111722] border border-slate-800 shadow-lg flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gross Sales Revenue</span>
          <div className="my-3">
            <span className="text-2xl font-black font-mono text-emerald-400">
              ₹{stats.totalRevenue.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">{stats.orderCount} Orders Billed</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[85%]" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111722] border border-slate-800 shadow-lg flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Procurement Invoices</span>
          <div className="my-3">
            <span className="text-2xl font-black font-mono text-rose-400">
              ₹{stats.supplierBillsTotal.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Supplier bills registered</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-400 h-full w-[45%]" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111722] border border-slate-800 shadow-lg flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Taxes Collected (GST & VAT)</span>
          <div className="my-3">
            <span className="text-2xl font-black font-mono text-sky-400">
              ₹{(stats.foodGstTotal + stats.liquorVatTotal).toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              GST: ₹{stats.foodGstTotal.toFixed(0)} • VAT: ₹{stats.liquorVatTotal.toFixed(0)}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-sky-400 h-full w-[70%]" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111722] border border-slate-800 shadow-lg flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Net Operating Surplus</span>
          <div className="my-3">
            <span className={`text-2xl font-black font-mono ${netEarnings >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              ₹{netEarnings.toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Sales minus Procurement</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-teal-400 h-full w-[90%]" />
          </div>
        </div>
      </div>

      {/* Tax & Discount Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-[#111722] border border-slate-800 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-teal-400" />
            Tax Compliance Division (Restaurant vs. Bar)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-[#0d121b] p-3 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Food & Beverages GST (5%)</span>
                <span className="text-[11px] text-slate-500">Applicable to Kitchen Station items</span>
              </div>
              <span className="text-sm font-black font-mono text-emerald-400">
                ₹{stats.foodGstTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center bg-[#0d121b] p-3 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Liquor & Spirits VAT (10%)</span>
                <span className="text-[11px] text-slate-500">Applicable to Bar Station items</span>
              </div>
              <span className="text-sm font-black font-mono text-amber-400">
                ₹{stats.liquorVatTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center bg-[#0d121b] p-3 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Audited Discounts Given</span>
                <span className="text-[11px] text-slate-500">Authorized by Manager PIN</span>
              </div>
              <span className="text-sm font-black font-mono text-rose-400">
                -₹{stats.discountTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Status Summary */}
        <div className="p-6 rounded-3xl bg-[#111722] border border-slate-800 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Boxes className="w-4 h-4 text-sky-400" />
            Inventory Capital Summary
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d121b] p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Restaurant Raw Items</span>
              <span className="text-xl font-black text-white block mt-1">
                {inventorySummary.totalRestoItems} SKUs
              </span>
            </div>
            <div className="bg-[#0d121b] p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Bar Bottles & Spirits</span>
              <span className="text-xl font-black text-white block mt-1">
                {inventorySummary.totalBarItems} SKUs
              </span>
            </div>
          </div>

          {inventorySummary.lowStockCount > 0 ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>
                <strong>Warning:</strong> {inventorySummary.lowStockCount} inventory items are below safety reorder threshold!
              </span>
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 text-center">
              All inventory levels are currently healthy and above threshold.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}