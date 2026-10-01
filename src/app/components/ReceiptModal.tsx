'use client';

import { Printer, X } from 'lucide-react';

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  station: string;
}

interface ReceiptData {
  orderNumber: number;
  tableNumber: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  foodGst: number;
  liquorVat: number;
  grandTotal: number;
  paymentMethod?: string;
}

export default function ReceiptModal({
  data,
  onClose,
}: {
  data: ReceiptData;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* On-screen control container */}
      <div className="flex flex-col items-center gap-4 max-h-[95vh] overflow-y-auto w-full max-w-sm">
        <div className="flex w-full justify-between items-center px-2">
          <span className="text-xs text-zinc-400 font-mono">Thermal Receipt Preview (80mm)</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Paper Canvas (80mm width standard = 302px / ~76-80mm) */}
        <div
          id="printable-receipt"
          className="w-[300px] bg-white text-black p-5 shadow-2xl font-mono text-xs rounded-lg"
        >
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-zinc-400">
            <h2 className="text-base font-bold tracking-wider uppercase">MAHOTSAV RESTOBAR</h2>
            <p className="text-[10px] text-zinc-600">Fine Dine & Lounge</p>
            <p className="text-[10px] text-zinc-500">GSTIN: 27AAAAA0000A1Z5</p>
          </div>

          {/* Meta Info */}
          <div className="py-2.5 border-b border-dashed border-zinc-400 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>Order: #{data.orderNumber}</span>
              <span className="font-bold">Table: {data.tableNumber}</span>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>Date: {data.date}</span>
              <span>{data.paymentMethod ? `Mode: ${data.paymentMethod}` : 'UNPAID'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-zinc-400">
            <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-zinc-200">
              <span className="w-32">ITEM</span>
              <span className="w-8 text-center">QTY</span>
              <span className="w-16 text-right">AMT</span>
            </div>
            <div className="space-y-1.5 pt-1.5">
              {data.items.map((item) => (
                <div key={item.id} className="flex justify-between text-[11px] leading-tight">
                  <span className="w-32 truncate">{item.name}</span>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <span className="w-16 text-right font-medium">
                    {(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Breakdown */}
          <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Item Subtotal:</span>
              <span>₹{data.subtotal.toFixed(2)}</span>
            </div>
            {data.foodGst > 0 && (
              <div className="flex justify-between text-zinc-700">
                <span>Food GST (5%):</span>
                <span>₹{data.foodGst.toFixed(2)}</span>
              </div>
            )}
            {data.liquorVat > 0 && (
              <div className="flex justify-between text-zinc-700">
                <span>Liquor VAT (10%):</span>
                <span>₹{data.liquorVat.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-zinc-300">
              <span>GRAND TOTAL:</span>
              <span>₹{data.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-3 space-y-0.5 text-[10px] text-zinc-600">
            <p className="font-semibold">Thank you for dining with us!</p>
            <p>Visit again soon</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-2xl text-xs shadow-lg transition"
        >
          <Printer className="w-4 h-4" />
          Print Receipt (Ctrl+P)
        </button>
      </div>

      {/* Direct Thermal Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}