'use client';

import { useState } from 'react';
import { Lock, Delete, X, ShieldAlert } from 'lucide-react';
import { verifyUserPin } from '../actions/staff';

interface PinLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  requiredRoles?: ('OWNER' | 'RESTO_MANAGER' | 'BAR_MANAGER' | 'CHEF')[];
  title?: string;
  subtitle?: string;
}

export default function PinLockModal({
  isOpen,
  onClose,
  onSuccess,
  requiredRoles,
  title = 'Staff Authentication',
  subtitle = 'Enter your 4-digit PIN to proceed',
}: PinLockModalProps) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verify = async (pinToTest: string) => {
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const res = await verifyUserPin(pinToTest);
      if (!res.success) {
        setErrorMsg(res.message || 'Invalid PIN');
        setPin('');
        return;
      }

      const user = res.user;

      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(user.role)) {
          setErrorMsg(`Access restricted. Requires ${requiredRoles.join(' or ')}.`);
          setPin('');
          return;
        }
      }

      onSuccess(user);
      onClose();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-xs rounded-[32px] p-6 shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center pb-2">
          <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <Lock className="w-4 h-4" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center mt-2">
          <h3 className="text-base font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* PIN Dots */}
        <div className="flex gap-4 my-5">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                pin.length > index
                  ? 'bg-red-600 scale-110 shadow-sm shadow-red-500/40'
                  : 'bg-slate-100 border border-slate-300'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[11px] text-center flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              disabled={isVerifying}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 text-lg font-bold font-mono text-slate-800 transition flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}

          <button
            disabled={isVerifying}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-100/60 border border-slate-200 hover:bg-slate-200 text-xs font-bold text-slate-500 transition flex items-center justify-center"
          >
            CLR
          </button>

          <button
            disabled={isVerifying}
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 text-lg font-bold font-mono text-slate-800 transition flex items-center justify-center shadow-sm"
          >
            0
          </button>

          <button
            disabled={isVerifying}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-100/60 border border-slate-200 hover:bg-slate-200 text-slate-600 transition flex items-center justify-center"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}