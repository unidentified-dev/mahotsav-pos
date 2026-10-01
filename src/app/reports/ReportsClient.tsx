'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  MessageSquare,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { generateWhatsAppSummary } from '../actions/reports';

export default function ReportsClient({ initialData }: { initialData: any }) {
  const [data] = useState(initialData);

  // Dispatch directly to WhatsApp
  const handleWhatsAppSend = async () => {
    const { text } = await generateWhatsAppSummary();
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <main className="min-h-screen bg-[#090a0b] text-zinc-100 p-8 font-sans selection:bg-zinc-800">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              Daily Sales Register & Reporting
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Shift summary for {data.date} with one-click WhatsApp dispatch
            </p>
          </div>
        </div>

        {/* WhatsApp Button */}
        <div>
          <button
            onClick={handleWhatsAppSend}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-zinc-950 font-bold px-5 py-2.5 rounded-2xl text-xs shadow-lg transition"
          >
            <MessageSquare className="w-4 h-4 fill-zinc-950" />
            Send Daily Report to WhatsApp
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium block">Net Daily Revenue</span>
          <span className="text-3xl font-extrabold font-mono text-emerald-400 mt-2 block">
            ₹{data.netRevenue.toFixed(2)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">Gross: ₹{data.grossSales.toFixed(2)}</span>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium block">Orders Settled</span>
          <span className="text-3xl font-extrabold font-mono text-white mt-2 block">
            {data.totalOrders}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Avg Ticket: ₹{data.avgOrderValue.toFixed(2)}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium block">Taxes Collected</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 mt-2 block">
            ₹{(data.totalFoodGst + data.totalLiquorVat).toFixed(2)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            GST ₹{data.totalFoodGst.toFixed(2)} • VAT ₹{data.totalLiquorVat.toFixed(2)}
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium block">Special Discounts</span>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-2 block">
            -₹{data.totalDiscounts.toFixed(2)}
          </span>
          <span className="text-[11px] text-zinc-500 mt-1 block">Adjustments applied</span>
        </div>
      </div>

      {/* Today's Settled Orders List */}
      <div className="mt-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Today&apos;s Settled Bills Log
          </h3>
          <span className="text-xs font-mono text-zinc-400">{data.orders.length} Bills</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {data.orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No bills settled yet today. Settle a table order to see transactions here.
            </div>
          ) : (
            data.orders.map((order: any) => (
              <div
                key={order.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-900/50 transition gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Order #{order.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      PAID
                    </span>
                    {order.server && (
                      <span className="text-zinc-500">Server: {order.server.name}</span>
                    )}
                  </div>
                  <p className="text-zinc-500 mt-1 text-[11px]">
                    {order.items?.length || 0} items • Food GST: ₹{Number(order.foodGst).toFixed(2)} • VAT: ₹{Number(order.liquorVat).toFixed(2)}
                    {Number(order.discountAmount || 0) > 0 && ` • Discount: -₹${Number(order.discountAmount).toFixed(2)}`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-emerald-400 block">
                    ₹{Number(order.grandTotal).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}