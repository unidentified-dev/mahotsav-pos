'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  KeyRound,
  X,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { createStaffMember, toggleStaffStatus, deleteStaffMember } from '../actions/staff';

export default function StaffClient({ initialStaff }: { initialStaff: any[] }) {
  const [staffList, setStaffList] = useState(initialStaff);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'OWNER' | 'RESTO_MANAGER' | 'BAR_MANAGER' | 'CHEF'>('BAR_MANAGER');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || pin.length !== 4) {
      setErrorMsg('Please enter a valid name and a 4-digit PIN');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await createStaffMember({ name, pin, role });
      if (!res.success) {
        setErrorMsg(res.message || 'Error creating profile');
      } else {
        setStaffList((prev) => [...prev, res.user]);
        setIsModalOpen(false);
        setName('');
        setPin('');
        setRole('BAR_MANAGER');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (user: any) => {
    await toggleStaffStatus(user.id, user.isActive);
    setStaffList((prev) =>
      prev.map((s) => (s.id === user.id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user profile?')) return;
    await deleteStaffMember(userId);
    setStaffList((prev) => prev.filter((s) => s.id !== userId));
  };

  return (
    <main className="min-h-screen bg-[#090a0b] text-zinc-100 p-8 font-sans selection:bg-zinc-800">
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
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              Owner Controls • System User Profiles
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage terminal roles, authorities, and 4-digit PIN access
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 font-semibold px-4 py-2.5 rounded-2xl text-xs shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add User Profile
        </button>
      </header>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {staffList.map((user) => (
          <div
            key={user.id}
            className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {user.name}
                  {!user.isActive && (
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">(Disabled)</span>
                  )}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider inline-block mt-1">
                  {user.role.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs bg-zinc-800/80 px-2.5 py-1 rounded-xl text-zinc-300">
                <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                PIN: {user.pin}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-zinc-800/60">
              <button
                onClick={() => handleToggle(user)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                  user.isActive
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'border-zinc-700 text-zinc-400 bg-zinc-800 hover:bg-zinc-700'
                }`}
              >
                {user.isActive ? 'Active' : 'Disabled'}
              </button>

              {user.role !== 'OWNER' && (
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition"
                  title="Remove Profile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121316] border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Create Profile</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Patil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-zinc-600 tracking-widest text-center"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Authority Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                  >
                    <option value="OWNER">Owner (All Controls)</option>
                    <option value="RESTO_MANAGER">Resto Manager (2nd Owner)</option>
                    <option value="BAR_MANAGER">Bar Manager (Supervisor)</option>
                    <option value="CHEF">Chef (KOT Only)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}