'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  UtensilsCrossed,
  ChefHat,
  Boxes,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react';

export default function FloatingSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Floor Plan', href: '/', icon: LayoutGrid },
    { label: 'Menu Catalog', href: '/menu', icon: UtensilsCrossed },
    { label: 'Kitchen KDS', href: '/kitchen', icon: ChefHat },
    { label: 'Inventory', href: '/inventory', icon: Boxes },
    { label: 'Sales Reports', href: '/reports', icon: TrendingUp },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('mahotsav_current_user');
    window.location.href = '/';
  };

  return (
    <aside className="fixed left-5 top-6 bottom-6 z-40 w-16 bg-[#111111] text-white rounded-[32px] shadow-2xl flex flex-col items-center justify-between py-6 select-none border border-black/10">
      {/* Brand Icon */}
      <Link
        href="/"
        className="w-10 h-10 rounded-2xl bg-white text-black font-black text-base flex items-center justify-center shadow-md hover:scale-105 transition"
      >
        M.
      </Link>

      {/* Navigation Icons */}
      <nav className="flex flex-col items-center gap-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`p-3 rounded-2xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[1.8]" />

              {/* Tooltip on Hover */}
              <span className="absolute left-16 top-2 bg-black text-white text-[11px] font-medium px-3 py-1 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Lock / Logout Action */}
      <button
        onClick={handleLogout}
        title="Lock Terminal"
        className="p-3 rounded-2xl text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition group relative"
      >
        <LogOut className="w-5 h-5 stroke-[1.8]" />
        <span className="absolute left-16 top-2 bg-black text-white text-[11px] font-medium px-3 py-1 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
          Switch User
        </span>
      </button>
    </aside>
  );
}