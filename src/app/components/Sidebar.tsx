'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  ChefHat,
  Wine,
  Boxes,
  BookOpen,
  Settings,
  Lock,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mahotsav_current_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, [pathname]);

  const isBarManager = currentUser?.role === 'BAR_MANAGER';

  const handleLogout = () => {
    localStorage.removeItem('mahotsav_current_user');
    window.location.href = '/';
  };

  return (
    <aside className="fixed left-6 top-8 bottom-8 w-16 bg-white border border-slate-200/90 rounded-3xl shadow-xl flex flex-col items-center justify-between py-6 z-40 select-none">
      {/* Brand Icon */}
      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-bold text-base flex items-center justify-center shadow-md">
        M.
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-3">
        {/* Floor View */}
        <Link
          href="/"
          title="Floor Plan & POS"
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            pathname === '/'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-5 h-5 stroke-[1.8]" />
        </Link>

        {/* KDS / Bar BOT Display */}
        <Link
          href="/kitchen"
          title={isBarManager ? 'Bar Orders Display (BOT)' : 'Kitchen & Bar Display (KDS)'}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            pathname === '/kitchen'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {isBarManager ? (
            <Wine className="w-5 h-5 stroke-[1.8]" />
          ) : (
            <ChefHat className="w-5 h-5 stroke-[1.8]" />
          )}
        </Link>

        {/* Inventory - HIDDEN FOR BAR MANAGER */}
        {!isBarManager && (
          <Link
            href="/inventory"
            title="Kitchen Raw Stock Inventory"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              pathname === '/inventory'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-5 h-5 stroke-[1.8]" />
          </Link>
        )}

        {/* Menu Catalog */}
        <Link
          href="/menu"
          title={isBarManager ? 'Bar Spirits Menu' : 'Menu Management'}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            pathname === '/menu'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5 stroke-[1.8]" />
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          title="Settings & Profile"
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            pathname === '/settings'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className="w-5 h-5 stroke-[1.8]" />
        </Link>
      </nav>

      {/* Lock / Logout Action */}
      <button
        onClick={handleLogout}
        title="Lock Terminal"
        className="w-11 h-11 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
      >
        <Lock className="w-5 h-5 stroke-[1.8]" />
      </button>
    </aside>
  );
}