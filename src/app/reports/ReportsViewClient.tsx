'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  UtensilsCrossed,
  Wine,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
} from 'lucide-react';

export default function ReportsViewClient({
  selectedRange,
  rangeLabel,
  totalSales,
  totalFoodGst,
  totalLiquorVat,
  totalDiscounts,
  restoRevenue,
  barRevenue,
  cashTotal,
  cardTotal,
  upiTotal,
  settledOrders,
}: {
  selectedRange: string;
  rangeLabel: string;
  totalSales: number;
  totalFoodGst: number;
  totalLiquorVat: number;
  totalDiscounts: number;
  restoRevenue: number;
  barRevenue: number;
  cashTotal: number;
  cardTotal: number;
  upiTotal: number;
  settledOrders: any[];
}) {
  // 3. Consolidated Sales Report Page WhatsApp Share (Resto + Bar in one message)
  const handleShareConsolidatedWhatsApp = () => {
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const restoOrders = settledOrders.filter(
      (o) => !o.table?.section?.name?.toLowerCase().includes('bar')
    );
    const barOrders = settledOrders.filter(
      (o) => o.table?.section?.name?.toLowerCase().includes('bar')
    );

    const message =
      `📊 *MAHOTSAV RESTOBAR - CONSOLIDATED AUDIT REPORT*\n` +
      `📅 *Period:* ${rangeLabel} (${dateStr})\n` +
      `🧾 *Total Settled Tickets:* ${settledOrders.length}\n` +
      `💰 *NET TOTAL REVENUE:* ₹${totalSales.toFixed(2)}\n\n` +
      `═══════════════════════════\n` +
      `🍽️ *SECTION 1: RESTAURANT & KITCHEN*\n` +
      `═══════════════════════════\n` +
      `• *Food Net Sales:* ₹${restoRevenue.toFixed(2)}\n` +
      `• *Food GST Collected (5%):* ₹${totalFoodGst.toFixed(2)}\n` +
      `• *Restaurant Settled Bills:* ${restoOrders.length}\n\n` +
      `═══════════════════════════\n` +
      `🍾 *SECTION 2: BAR & SPIRITS LOUNGE*\n` +
      `═══════════════════════════\n` +
      `• *Liquor & Drinks Sales:* ₹${barRevenue.toFixed(2)}\n` +
      `• *Liquor VAT Collected (10%):* ₹${totalLiquorVat.toFixed(2)}\n` +
      `• *Bar Settled Bills:* ${barOrders.length}\n\n` +
      `═══════════════════════════\n` +
      `💳 *PAYMENT RECONCILIATION*\n` +
      `═══════════════════════════\n` +
      `💵 *Cash Drawer:* ₹${cashTotal.toFixed(2)}\n` +
      `💳 *Card POS:* ₹${cardTotal.toFixed(2)}\n` +
      `📱 *UPI / QR:* ₹${upiTotal.toFixed(2)}\n` +
      `🏷️ *Discounts Absorbed:* ₹${totalDiscounts.toFixed(2)}\n\n` +
      `_Dispatched from Mahotsav POS Ledger._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-900 pl-28 pr-8 py-8 font-sans">
      <div className="max-w-[1500px] mx-auto space-y-7">
        
        {/* Header Bar */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Return to floor"
            >
              <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Audited Sales & Revenue Ledger
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{rangeLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Range Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold">
              <Link
                href="/reports?range=today"
                className={`px-4 py-2 rounded-xl transition ${
                  selectedRange === 'today'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </Link>
              <Link
                href="/reports?range=week"
                className={`px-4 py-2 rounded-xl transition ${
                  selectedRange === 'week'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 7 Days
              </Link>
              <Link
                href="/reports?range=month"
                className={`px-4 py-2 rounded-xl transition ${
                  selectedRange === 'month'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 30 Days
              </Link>
            </div>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareConsolidatedWhatsApp}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
              title="Share combined Resto and Bar report"
            >
              <Share2 className="w-4 h-4 stroke-[2]" />
              <span>Share WhatsApp Report</span>
            </button>
          </div>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* TOTAL SETTLED REVENUE: Slate Grey with crisp White Text */}
          <div
            style={{ backgroundColor: '#1e293b' }}
            className="p-6 rounded-3xl text-white shadow-lg border border-slate-700 flex flex-col justify-between h-40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                TOTAL SETTLED REVENUE
              </span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>

            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              ₹{totalSales.toFixed(2)}
            </span>

            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              ✓ {settledOrders.length} Settled Orders
            </span>
          </div>

          {/* Kitchen Food Sales */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between h-40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                KITCHEN FOOD SALES
              </span>
              <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
            </div>

            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              ₹{restoRevenue.toFixed(2)}
            </span>

            <span className="text-xs text-slate-500 font-medium font-mono">
              Food GST (5%): ₹{totalFoodGst.toFixed(2)}
            </span>
          </div>

          {/* Bar & Spirits Sales */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between h-40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                BAR & SPIRITS SALES
              </span>
              <Wine className="w-4 h-4 text-purple-600" />
            </div>

            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              ₹{barRevenue.toFixed(2)}
            </span>

            <span className="text-xs text-slate-500 font-medium font-mono">
              Liquor VAT (10%): ₹{totalLiquorVat.toFixed(2)}
            </span>
          </div>

          {/* Discounts Given */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between h-40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                DISCOUNTS GIVEN
              </span>
              <Receipt className="w-4 h-4 text-rose-600" />
            </div>

            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              ₹{totalDiscounts.toFixed(2)}
            </span>

            <span className="text-xs text-rose-600 font-semibold">
              Authorized Deductions
            </span>
          </div>
        </div>

        {/* Payment Modes Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Banknote className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Cash Drawer
                </span>
                <span className="text-xl font-bold text-slate-900 block font-mono">
                  ₹{cashTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <CreditCard className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Card POS Machine
                </span>
                <span className="text-xl font-bold text-slate-900 block font-mono">
                  ₹{cardTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <QrCode className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  UPI / QR Payment
                </span>
                <span className="text-xl font-bold text-slate-900 block font-mono">
                  ₹{upiTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settled Ledger Table */}
        <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Settled Bills Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every settled transaction with timestamps, taxes, and payment methods
              </p>
            </div>
          </div>

          {settledOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No settled orders recorded for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th>Date & Time</th>
                    <th>Table & Section</th>
                    <th>Items Breakdown</th>
                    <th className="text-right">Taxes (GST/VAT)</th>
                    <th className="text-right">Discount</th>
                    <th className="text-center">Mode</th>
                    <th className="text-right pr-4">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settledOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{ord.orderNumber}
                      </td>
                      <td className="text-xs text-slate-500 font-mono">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        {new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <span className="font-semibold text-slate-800">
                          Table #{ord.table?.tableNumber || 'Takeaway'}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          {ord.table?.section?.name || 'Main Hall'}
                        </span>
                      </td>
                      <td className="max-w-xs">
                        <span className="text-xs text-slate-600 line-clamp-1">
                          {ord.items.map((i: any) => `${i.quantity}x ${i.menuItem?.name?.split('::')[0] || 'Item'}`).join(', ')}
                        </span>
                      </td>
                      <td className="text-right font-mono text-xs text-slate-600">
                        ₹{(Number(ord.foodGst) + Number(ord.liquorVat)).toFixed(2)}
                      </td>
                      <td className="text-right font-mono text-xs text-rose-600 font-semibold">
                        {Number(ord.discountAmount) > 0 ? `-₹${Number(ord.discountAmount).toFixed(2)}` : '—'}
                      </td>
                      <td className="text-center">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 uppercase">
                          {ord.paymentMethod || 'CARD'}
                        </span>
                      </td>
                      <td className="text-right pr-4 font-mono font-bold text-emerald-700">
                        ₹{Number(ord.grandTotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}