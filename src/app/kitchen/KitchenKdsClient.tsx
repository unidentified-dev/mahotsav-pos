'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChefHat, Wine, Clock, CheckCircle2, ArrowLeft, Bell } from 'lucide-react';
import { markOrderDispatched } from '../actions/order';

export default function KitchenKdsClient({ initialTickets }: { initialTickets: any[] }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stationFilter, setStationFilter] = useState<'ALL' | 'KITCHEN' | 'BAR'>('ALL');
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('mahotsav_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        if (u.role === 'BAR_MANAGER') {
          setStationFilter('BAR');
        }
      } catch {}
    }

    // Filter out tickets already dispatched in local history
    const dispatchedList: string[] = JSON.parse(localStorage.getItem('mahotsav_dispatched_orders') || '[]');
    setTickets(initialTickets.filter((t) => !dispatchedList.includes(String(t.id))));
  }, [initialTickets]);

  const isBarManager = currentUser?.role === 'BAR_MANAGER';

  const filteredTickets = tickets.filter((t) => {
    if (isBarManager || stationFilter === 'BAR') {
      return t.items.some((i: any) => i.station === 'BAR');
    }
    if (stationFilter === 'KITCHEN') {
      return t.items.some((i: any) => i.station === 'KITCHEN');
    }
    return true;
  });

  const handleMarkReady = async (ticket: any) => {
    // 1. Record in persistent dispatched storage
    const dispatchedList: string[] = JSON.parse(localStorage.getItem('mahotsav_dispatched_orders') || '[]');
    if (!dispatchedList.includes(String(ticket.id))) {
      dispatchedList.push(String(ticket.id));
      localStorage.setItem('mahotsav_dispatched_orders', JSON.stringify(dispatchedList));
    }

    // 2. Fire real-time notification event for Manager Terminal
    const notificationPayload = {
      id: `disp-${Date.now()}`,
      tableNumber: ticket.tableNumber,
      orderNumber: ticket.orderNumber,
      itemsCount: ticket.items?.length || 0,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    localStorage.setItem('mahotsav_kds_dispatch_event', JSON.stringify(notificationPayload));

    // 3. Remove immediately from state
    setTickets((prev) => prev.filter((t) => t.id !== ticket.id));

    // 4. Server dispatch sync
    try {
      await markOrderDispatched(ticket.id);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-900 pl-28 pr-8 py-8 font-sans">
      <div className="max-w-[1500px] mx-auto space-y-7">
        
        {/* Header */}
        <div className="pos-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {isBarManager ? 'Bar Orders Display (BOT)' : 'Kitchen & Bar Display System (KDS)'}
              </h1>
              <p className="text-sm font-normal text-slate-500 mt-0.5">
                {isBarManager
                  ? 'Real-time active drink tickets and beverage prep queue'
                  : 'Real-time active tickets. Marking ready notifies the Resto Manager terminal immediately.'}
              </p>
            </div>
          </div>

          {!isBarManager ? (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-medium">
              <button
                onClick={() => setStationFilter('ALL')}
                className={`px-4 py-2 rounded-xl transition ${
                  stationFilter === 'ALL' ? 'bg-slate-900 text-white font-medium shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Orders ({tickets.length})
              </button>
              <button
                onClick={() => setStationFilter('KITCHEN')}
                className={`px-4 py-2 rounded-xl transition ${
                  stationFilter === 'KITCHEN' ? 'bg-slate-900 text-white font-medium shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kitchen Only
              </button>
              <button
                onClick={() => setStationFilter('BAR')}
                className={`px-4 py-2 rounded-xl transition ${
                  stationFilter === 'BAR' ? 'bg-slate-900 text-white font-medium shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bar Only
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-xs font-semibold text-purple-800">
              <Wine className="w-4 h-4" />
              <span>Bar Drinks Queue</span>
            </div>
          )}
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length === 0 ? (
          <div className="pos-card p-16 text-center text-slate-500">
            {isBarManager ? (
              <Wine className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
            ) : (
              <ChefHat className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
            )}
            <h3 className="text-base font-semibold text-slate-700">All orders are cleared!</h3>
            <p className="text-sm font-normal text-slate-400 mt-1">No pending tickets in this queue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => {
              const displayItems = isBarManager
                ? ticket.items.filter((i: any) => i.station === 'BAR')
                : ticket.items;

              return (
                <div key={ticket.id} className="pos-card p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Table #{ticket.tableNumber}
                        </h3>
                        <span className="text-xs font-mono text-slate-400">
                          Order #{ticket.orderNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                        <Clock className="w-3.5 h-3.5" />
                        {ticket.createdAt}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      {displayItems.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-sm py-1">
                          <span className="font-medium text-slate-800">
                            <strong className="font-semibold text-slate-900">{item.quantity}x</strong>{' '}
                            {item.name?.split('::')[0]}
                          </span>
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                              item.station === 'BAR'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.station}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleMarkReady(ticket)}
                    className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2]" />
                    Mark Ready & Dispatch
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}