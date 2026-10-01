'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Delete, ShieldAlert, LogOut, UtensilsCrossed } from 'lucide-react';
import { verifyUserPin } from '../actions/staff';

export default function AuthTerminalWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mahotsav_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);

        if (parsed.role === 'CHEF' && pathname !== '/kitchen') {
          router.push('/kitchen');
        }
      } catch {
        localStorage.removeItem('mahotsav_current_user');
      }
    }
    setIsCheckingAuth(false);
  }, [pathname, router]);

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
      setCurrentUser(user);
      localStorage.setItem('mahotsav_current_user', JSON.stringify(user));
      setPin('');

      if (user.role === 'CHEF') {
        router.push('/kitchen');
      } else if (pathname === '/kitchen') {
        router.push('/');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mahotsav_current_user');
    setCurrentUser(null);
    setPin('');
    setErrorMsg('');
    router.push('/');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#090b10] flex items-center justify-center text-zinc-500 font-mono text-xs">
        Starting Mahotsav Terminal...
      </div>
    );
  }

  // DEEP DARK FULLSCREEN PIN LOGIN
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 bg-[#090b10] text-zinc-100 flex flex-col items-center justify-center p-6 select-none">
        <div className="w-full max-w-sm flex flex-col items-center bg-[#10141d] border border-zinc-800 shadow-2xl p-8 rounded-[36px]">
          
          <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 mb-4 shadow-sm">
            <UtensilsCrossed className="w-8 h-8" />
          </div>

          <h1 className="text-xl font-black tracking-tight text-white">MAHOTSAV RESTOBAR</h1>
          <p className="text-xs text-zinc-400 mt-1">Terminal Lock • Enter 4-Digit PIN</p>

          <div className="flex gap-4 my-6">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  pin.length > index
                    ? 'bg-red-500 scale-125 shadow-md shadow-red-500/40'
                    : 'bg-zinc-900 border border-zinc-700'
                }`}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="mb-4 px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                disabled={isVerifying}
                onClick={() => handleDigit(digit)}
                className="h-14 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-lg font-bold font-mono text-white transition flex items-center justify-center shadow-sm"
              >
                {digit}
              </button>
            ))}

            <button
              disabled={isVerifying}
              onClick={handleClear}
              className="h-14 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition flex items-center justify-center"
            >
              CLR
            </button>

            <button
              disabled={isVerifying}
              onClick={() => handleDigit('0')}
              className="h-14 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-lg font-bold font-mono text-white transition flex items-center justify-center shadow-sm"
            >
              0
            </button>

            <button
              disabled={isVerifying}
              onClick={handleDelete}
              className="h-14 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition flex items-center justify-center"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 text-center text-[11px] text-zinc-500 font-mono space-y-0.5">
            <div>Owner: 0000 • Resto Mgr: 1111</div>
            <div>Bar Mgr: 2222 • Chef: 3333</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Floating Active User Pill */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-[#121620]/95 border border-zinc-800 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <div className="text-xs">
          <span className="text-white font-bold">{currentUser.name}</span>
          <span className="text-zinc-400 font-mono ml-1.5 text-[11px]">
            [{currentUser.role.replace('_', ' ')}]
          </span>
        </div>
        <button
          onClick={handleLogout}
          title="Lock / Switch User"
          className="ml-2 p-1.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {children}
    </div>
  );
}