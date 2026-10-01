'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Wine, Clock, CheckCircle2, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function KdsClient({ initialOrders }: { initialOrders: any[] }) {
  const router = useRouter();
  const [completedTickets, setCompletedTickets] = useState<string[]>([]);

  // Auto-refresh the KDS screen every 5 seconds for incoming tickets
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  const activeOrders = initialOrders.filter((o) => !completedTickets.includes(o.id));

  const handleDismiss = (orderId: string) => {
    setCompletedTickets((prev) => [...prev, orderId]);
  };

  return (
    <main className="min-h-screen bg-[#090a0b] text-zinc-100 p-8 font-sans selection:bg-zinc-800">
      {/* Top Bar */}
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
              <ChefHat className="w-6 h-6 text-amber-400" />
              Kitchen & Bar Display (KDS)
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Auto-refreshing live station queue</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Polling Live
          </span>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
            {activeOrders.length} Pending
          </span>
        </div>
      </header>

      {/* Grid */}
      <div className="mt-8">
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CheckCircle2 className="w-12 h-12 text-zinc-700 mb-3" />
            <h3 className="text-lg font-medium text-zinc-300">All orders clear</h3>
            <p className="text-xs text-zinc-500 mt-1">New KOTs punched from tables will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {activeOrders.map((order: any) => {
              const kitchenItems = order.items.filter((i: any) => i.station === 'KITCHEN');
              const barItems = order.items.filter((i: any) => i.station === 'BAR');

              return (
                <div
                  key={order.id}
                  className="flex flex-col justify-between rounded-3xl bg-zinc-900/70 border border-zinc-800 overflow-hidden shadow-lg hover:border-zinc-700 transition"
                >
                  <div>
                    {/* Header */}
                    <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono text-zinc-500">#{order.orderNumber}</span>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          Table {order.table?.tableNumber || 'Takeaway'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                      {kitchenItems.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            <ChefHat className="w-3.5 h-3.5 text-zinc-500" />
                            Kitchen Station
                          </div>
                          <ul className="space-y-2">
                            {kitchenItems.map((item: any) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between text-sm bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/40"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-white">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-medium text-zinc-200">
                                    {item.menuItem?.name}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {barItems.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            <Wine className="w-3.5 h-3.5 text-amber-500" />
                            Bar Station
                          </div>
                          <ul className="space-y-2">
                            {barItems.map((item: any) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between text-sm bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/40"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-xs">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-medium text-zinc-200">
                                    {item.menuItem?.name}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dispatch Footer */}
                  <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/30">
                    <button
                      onClick={() => handleDismiss(order.id)}
                      className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white py-2.5 rounded-2xl font-medium text-xs transition duration-200"
                    >
                      <Check className="w-4 h-4" />
                      Mark Ready / Dispatched
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}