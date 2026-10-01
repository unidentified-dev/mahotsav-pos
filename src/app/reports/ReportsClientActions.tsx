'use client';

import { Share2 } from 'lucide-react';

export default function ReportsClientActions({ summary }: { summary: any }) {
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📊 *MAHOTSAV RESTOBAR - DAILY SALES REGISTER*\n` +
      `📅 Date: ${new Date().toLocaleDateString('en-IN')}\n` +
      `--------------------------------\n` +
      `💰 *Total Revenue:* ₹${summary.totalRevenue.toFixed(2)}\n` +
      `🧾 *Bills Settled:* ${summary.orderCount}\n` +
      `--------------------------------\n` +
      `💵 *Cash Counter:* ₹${summary.cashTotal.toFixed(2)}\n` +
      `💳 *Card POS:* ₹${summary.cardTotal.toFixed(2)}\n` +
      `📱 *UPI / QR Scan:* ₹${summary.upiTotal.toFixed(2)}\n` +
      `--------------------------------\n` +
      `🍴 *Food GST (5%):* ₹${summary.totalFoodGst.toFixed(2)}\n` +
      `🍾 *Liquor VAT (10%):* ₹${summary.totalLiquorVat.toFixed(2)}\n` +
      `🏷️ *Discounts Audited:* ₹${summary.totalDiscounts.toFixed(2)}\n` +
      `--------------------------------\n` +
      `Generated directly from Mahotsav POS Terminal.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <button
      onClick={handleShareWhatsApp}
      className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-95 text-slate-950 font-semibold px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-emerald-500/10 transition"
    >
      <Share2 className="w-4 h-4 stroke-[2]" />
      Share Daily Register to WhatsApp
    </button>
  );
}