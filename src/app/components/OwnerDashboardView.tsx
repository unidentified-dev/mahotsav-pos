'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  PieChart as PieIcon,
  CreditCard,
  Banknote,
  QrCode,
  Calendar,
} from 'lucide-react';

export default function OwnerDashboardView({ summary }: { summary: any }) {
  if (!summary) return null;

  // Safe destructuring with fallback objects to prevent undefined errors
  const grossToday = Number(summary.grossSalesToday || 0);
  const grossWeek = Number(summary.grossSalesWeek || 0);
  const grossMonth = Number(summary.grossSalesMonth || 0);
  const netProfit = Number(summary.netProfitToday || 0);
  const taxesTotal = Number(summary.taxesTotal || 0);
  const cogsAmount = Number(summary.cogsAmount || 0);
  const expenses = Number(summary.expensesAmount || 0);
  const ordersCount = Number(summary.orderCount || 0);

  // Safe inventory alerts handling
  const inventoryAlerts: any[] = summary.inventory?.lowStockAlerts || [];
  const lowStockCount = Number(summary.lowStockCount || inventoryAlerts.length || 0);

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      
      {/* 1. STOCK REFILL NOTIFICATION BANNER */}
      {lowStockCount > 0 && (
        <div className="p-5 rounded-3xl bg-rose-500 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-base font-bold">
                Low Inventory Warning: {lowStockCount} Items Below Threshold
              </h4>
              <p className="text-xs text-rose-100 mt-0.5">
                Certain high-consumption ingredients or spirits require reordering to prevent service disruption.
              </p>
            </div>
          </div>
          <Link
            href="/inventory"
            className="px-5 py-2.5 rounded-2xl bg-white text-rose-600 font-bold text-xs hover:bg-rose-50 transition shrink-0 text-center"
          >
            Review Stock &rarr;
          </Link>
        </div>
      )}

      {/* 2. TOP EXECUTIVE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Settled Sales */}
        <div className="pos-card p-6 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Today's Net Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block mt-2 font-mono">
            ₹{grossToday.toFixed(2)}
          </span>
          <span className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {ordersCount} Settled Tables
          </span>
        </div>

        {/* Weekly Projected Sales */}
        <div className="pos-card p-6 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Weekly Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block mt-2 font-mono">
            ₹{grossWeek.toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 font-medium mt-1 block">
            Rolling 7-day revenue
          </span>
        </div>

        {/* Estimated Daily Net Profit */}
        <div className="pos-card p-6 bg-slate-900 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Margin (Est.)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-white block mt-2 font-mono">
            ₹{netProfit.toFixed(2)}
          </span>
          <span className="text-xs text-emerald-400 font-semibold mt-1 block">
            After COGS, Taxes & OPEX
          </span>
        </div>

        {/* Taxes Collected (GST + VAT) */}
        <div className="pos-card p-6 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tax Liability
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 block mt-2 font-mono">
            ₹{taxesTotal.toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 font-medium mt-1 block">
            5% Food GST + 10% Liquor VAT
          </span>
        </div>
      </div>

      {/* 3. EXECUTIVE P&L BREAKDOWN TABLE */}
      <div className="pos-card p-7 space-y-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-slate-900" />
              Executive Profit & Loss Statement (P&L)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live automated accounting generated directly from settled dine-in and bar registers
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800">
            Real-Time Audit
          </span>
        </div>

        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-100 text-slate-800">
            <span className="font-sans font-medium">(+) Gross Settled Sales</span>
            <span className="font-bold text-slate-950">₹{grossToday.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100 text-slate-600">
            <span className="font-sans font-medium">(-) Estimated Food & Liquor COGS (32%)</span>
            <span className="text-rose-600 font-semibold">-₹{cogsAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100 text-slate-600">
            <span className="font-sans font-medium">(-) State Liquor VAT (10%) & Central GST (5%)</span>
            <span className="text-rose-600 font-semibold">-₹{taxesTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100 text-slate-600">
            <span className="font-sans font-medium">(-) Daily Allocated Overhead & Payroll (OPEX)</span>
            <span className="text-rose-600 font-semibold">-₹{expenses.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center pt-3 text-base font-sans font-bold text-slate-900">
            <span>(=) Net Operating Income</span>
            <span className="text-xl font-mono text-emerald-700 font-extrabold">
              ₹{netProfit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}