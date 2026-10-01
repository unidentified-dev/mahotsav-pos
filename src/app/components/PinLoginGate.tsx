'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, ShieldCheck, UserCheck } from 'lucide-react';
import { verifyStaffPin } from '../actions/auth';

export default function PinLoginGate({
  onSuccess,
}: {
  onSuccess: (user: any) => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if session already exists
  useEffect(() => {
    const saved = localStorage.getItem('mahotsav_current_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && (u.name || u.id)) {
          onSuccess(u);
          setIsCheckingAuth(false);
          return;
        }
      } catch {}
    }
    setIsCheckingAuth(false);
  }, [onSuccess]);

  const submitPin = useCallback(async (fullPin: string) => {
    setIsLoading(true);
    setError('');

    try {
      // 1. Instant fallback credentials for standard terminals
      if (fullPin === '1234') {
        const ownerUser = {
          id: 'admin-master',
          name: 'Vikrant Jaysing Bhonsle (Owner)',
          role: 'OWNER',
          pin: '1234',
        };
        localStorage.setItem('mahotsav_current_user', JSON.stringify(ownerUser));
        onSuccess(ownerUser);
        return;
      }

      if (fullPin === '1111') {
        const restoMgrUser = {
          id: 'resto-mgr-default',
          name: 'Resto Manager',
          role: 'RESTO_MANAGER',
          pin: '1111',
        };
        localStorage.setItem('mahotsav_current_user', JSON.stringify(restoMgrUser));
        onSuccess(restoMgrUser);
        return;
      }

      if (fullPin === '2222') {
        const barMgrUser = {
          id: 'bar-mgr-default',
          name: 'Bar Manager',
          role: 'BAR_MANAGER',
          pin: '2222',
        };
        localStorage.setItem('mahotsav_current_user', JSON.stringify(barMgrUser));
        onSuccess(barMgrUser);
        return;
      }

      // 2. Database staff check
      const res = await verifyStaffPin(fullPin);
      if (res && res.success && res.user) {
        localStorage.setItem('mahotsav_current_user', JSON.stringify(res.user));
        onSuccess(res.user);
      } else {
        setError(res?.error || 'Invalid 4-digit PIN. Try 1111 (Resto), 1234 (Owner), or 2222 (Bar).');
        setPin('');
      }
    } catch {
      setError('Unable to verify PIN. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  const handleKeyPress = useCallback((num: string) => {
    if (isLoading) return;
    setPin((prev) => {
      if (prev.length >= 4) return prev;
      const nextPin = prev + num;
      setError('');
      if (nextPin.length === 4) {
        setTimeout(() => submitPin(nextPin), 50);
      }
      return nextPin;
    });
  }, [isLoading, submitPin]);

  const handleDelete = useCallback(() => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, [isLoading]);

  // Physical Keyboard & Numpad Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers 0-9 from top row or numpad
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        setPin('');
        setError('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleDelete]);

  if (isCheckingAuth) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-sm space-y-6 shadow-2xl border border-slate-200 text-center">
        
        {/* Header */}
        <div className="space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight pt-2">
            Terminal Access Lock
          </h2>
          <p className="text-xs text-slate-500">
            Type with your physical keyboard numpad or tap onscreen
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                pin.length > idx
                  ? 'bg-slate-900 scale-110 shadow-sm'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
            {error}
          </p>
        )}

        {/* Onscreen Numpad */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isLoading}
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-lg font-bold text-slate-900 transition flex items-center justify-center shadow-xs select-none"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            disabled={isLoading || pin.length === 0}
            onClick={() => { setPin(''); setError(''); }}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-xs font-semibold text-slate-500 transition flex items-center justify-center disabled:opacity-30 select-none"
          >
            Clear
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-lg font-bold text-slate-900 transition flex items-center justify-center shadow-xs select-none"
          >
            0
          </button>

          <button
            type="button"
            disabled={isLoading || pin.length === 0}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition flex items-center justify-center disabled:opacity-30 select-none"
          >
            <Delete className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Quick Helper */}
        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 space-y-0.5">
          <div>Owner: <span className="font-mono font-bold text-slate-700">1234</span> • Resto Mgr: <span className="font-mono font-bold text-slate-700">1111</span></div>
          <div>Bar Mgr: <span className="font-mono font-bold text-slate-700">2222</span></div>
        </div>
      </div>
    </div>
  );
}