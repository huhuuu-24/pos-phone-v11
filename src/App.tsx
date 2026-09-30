import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import POS from '@/views/POS';
import Inventory from '@/views/Inventory';
import Reports from '@/views/Reports';
import Backup from '@/views/Backup';
import Login from '@/views/Login';
import { supabase } from '@/lib/supabase';
import type { View } from '@/types';

export default function App() {
  const [view, setView] = useState<View>('pos');
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const { data } = await supabase.auth.getSession();

      setLoggedIn(!!data.session);
      setChecking(false);
    };

    checkLogin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-slate-400">
          正在检查登录状态...
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar current={view} onChange={setView} />

      <main className="flex-1 overflow-hidden">
        {view === 'pos' && <POS />}
        {view === 'inventory' && <Inventory />}
        {view === 'reports' && <Reports />}
        {view === 'backup' && <Backup />}
      </main>
    </div>
  );
}
