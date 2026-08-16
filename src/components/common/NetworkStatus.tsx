import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setOnline(false);
      setShowRestored(false);
    };
    const handleOnline = () => {
      setOnline(true);
      setShowRestored(true);
      window.setTimeout(() => setShowRestored(false), 3200);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (online && !showRestored) return null;

  return (
    <div className="fixed inset-x-0 top-3 z-[120] flex justify-center px-4 pointer-events-none" role="status" aria-live="polite">
      <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold shadow-lg ${online ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span>{online ? 'Connection restored.' : "You're offline. Some data may be unavailable."}</span>
      </div>
    </div>
  );
};
