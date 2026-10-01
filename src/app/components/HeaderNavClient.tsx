'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChefHat,
  TrendingUp,
  UtensilsCrossed,
  Users,
  Boxes,
  Lock,
  Bell,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import PinLockModal from './PinLockModal';

export default function HeaderNavClient({
  totalTables,
  occupiedTables,
}: {
  totalTables: number;
  occupiedTables: number;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('Authorization Required');

  useEffect(() => {
    const saved = localStorage.getItem('mahotsav_current_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const role = currentUser?.role || 'BAR_MANAGER';
  const isOwner = role === 'OWNER';
  const isChef = role === 'CHEF';
  const isBarManager = role === 'BAR_MANAGER';

  const handleProtectedNavigate = (
    url: string,
    title: string,
    allowedRoles: ('OWNER' | 'RESTO_MANAGER' | 'BAR_MANAGER')[]
  ) => {
    if (allowedRoles.includes(role)) {
      router.push(url);
      return;
    }
    setDestinationUrl(url);
    setModalTitle(title);
    setIsPinOpen(true);
  };

  const handlePinSuccess = () => {
    if (destinationUrl) {
      router.push(destinationUrl);
    }
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        {/* Brand & Terminal Station */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              MAHOTSAV RESTOBAR
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold uppercase">
                Terminal
              </span>
            </h1>
            <p className="text-xs text-slate-400">POS Floor Plan & Ordering Suite</p>
          </div>
        </div>

        {/* Modules & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/kitchen"
            className="flex items-center gap-2 bg-[#121824] hover:bg-[#1a2333] border border-slate-800 px-3 py-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-400" />
            Kitchen KDS
          </Link>

          <button
            onClick={() =>
              handleProtectedNavigate('/reports', 'Unlock Sales Register', [
                'OWNER',
                'RESTO_MANAGER',
                'BAR_MANAGER',
              ])
            }
            className="flex items-center gap-2 bg-[#121824] hover:bg-[#1a2333] border border-slate-800 px-3 py-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Sales Register
          </button>

          <button
            onClick={() =>
              handleProtectedNavigate('/menu', 'Unlock Menu & Stock', ['OWNER', 'RESTO_MANAGER'])
            }
            className="flex items-center gap-2 bg-[#121824] hover:bg-[#1a2333] border border-slate-800 px-3 py-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-teal-400" />
            Menu Stock
            {isBarManager && <Lock className="w-3 h-3 text-slate-500" />}
          </button>

          <button
            onClick={() =>
              handleProtectedNavigate('/inventory', 'Unlock Inventory', [
                'OWNER',
                'RESTO_MANAGER',
                'BAR_MANAGER',
              ])
            }
            className="flex items-center gap-2 bg-[#121824] hover:bg-[#1a2333] border border-slate-800 px-3 py-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
          >
            <Boxes className="w-3.5 h-3.5 text-sky-400" />
            Inventory
          </button>

          {isOwner && (
            <button
              onClick={() => handleProtectedNavigate('/staff', 'Unlock Team Roster', ['OWNER'])}
              className="flex items-center gap-2 bg-[#121824] hover:bg-[#1a2333] border border-slate-800 px-3 py-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Staff
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative p-2 rounded-2xl bg-[#121824] border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0b0f17]" />
          </div>

          {/* User Profile Badge */}
          {currentUser && (
            <div className="flex items-center gap-2.5 bg-[#121824] border border-slate-800 px-3 py-1.5 rounded-2xl shadow-sm">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-white block leading-none">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-teal-400 uppercase font-semibold">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <PinLockModal
        isOpen={isPinOpen}
        onClose={() => setIsPinOpen(false)}
        onSuccess={handlePinSuccess}
        requiredRoles={['OWNER', 'RESTO_MANAGER']}
        title={modalTitle}
        subtitle="Requires Owner (0000) or Resto Manager (1111) PIN"
      />
    </>
  );
}