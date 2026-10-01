'use client';

interface TopViewTableProps {
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLED';
  onClick: () => void;
  isSelected?: boolean;
  orderTotal?: number;
}

export default function TopViewTable({
  tableNumber,
  capacity,
  status,
  onClick,
  isSelected,
  orderTotal,
}: TopViewTableProps) {
  // Color configuration by state
  const isOccupied = status === 'OCCUPIED';
  const isBilled = status === 'BILLED';

  const tableBg = isBilled
    ? 'bg-purple-950/40 border-purple-500 shadow-purple-500/20'
    : isOccupied
    ? 'bg-rose-950/40 border-rose-500 shadow-rose-500/20'
    : 'bg-[#151c28] border-slate-700/80 hover:border-emerald-400/80 shadow-slate-950/50';

  const chairColor = isBilled
    ? 'bg-purple-500/50 border-purple-400'
    : isOccupied
    ? 'bg-rose-500/50 border-rose-400'
    : 'bg-slate-700/60 border-slate-600';

  const ringGlow = isSelected ? 'ring-2 ring-teal-400 scale-[1.03]' : '';

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer select-none transition-all duration-200 flex flex-col items-center justify-center p-3 rounded-3xl ${ringGlow} group`}
    >
      {/* Top Chairs */}
      <div className="flex gap-4 mb-1">
        {Array.from({ length: Math.min(Math.ceil(capacity / 2), 3) }).map((_, idx) => (
          <div
            key={`top-${idx}`}
            className={`w-6 h-2.5 rounded-t-lg border-t border-x ${chairColor} transition-colors group-hover:bg-teal-400/50`}
          />
        ))}
      </div>

      {/* Main Table Surface (Architectural Top View) */}
      <div
        className={`w-28 h-20 rounded-2xl border-2 ${tableBg} flex flex-col items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105`}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isBilled
                ? 'bg-purple-400 animate-pulse'
                : isOccupied
                ? 'bg-rose-400 animate-pulse'
                : 'bg-emerald-400'
            }`}
          />
          <span className="text-xs font-black tracking-tight text-white font-mono">
            {tableNumber}
          </span>
        </div>

        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
          {capacity} Seats
        </span>

        {isOccupied && orderTotal ? (
          <span className="text-[10px] font-black font-mono text-amber-300 mt-1">
            ₹{orderTotal.toFixed(0)}
          </span>
        ) : (
          <span
            className={`text-[9px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-md ${
              isBilled
                ? 'bg-purple-500/20 text-purple-300'
                : isOccupied
                ? 'bg-rose-500/20 text-rose-300'
                : 'text-emerald-400'
            }`}
          >
            {status}
          </span>
        )}
      </div>

      {/* Bottom Chairs */}
      <div className="flex gap-4 mt-1">
        {Array.from({ length: Math.min(Math.floor(capacity / 2), 3) }).map((_, idx) => (
          <div
            key={`bottom-${idx}`}
            className={`w-6 h-2.5 rounded-b-lg border-b border-x ${chairColor} transition-colors group-hover:bg-teal-400/50`}
          />
        ))}
      </div>
    </div>
  );
}