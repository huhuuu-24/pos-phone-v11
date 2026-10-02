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
    let mounted = true;

    // =========================
    // 检查已经保存的登录状态
    // =========================
    const checkLogin = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setLoggedIn(!!session);
        setChecking(false);
      } catch (error) {
        console.error('检查登录状态失败:', error);

        if (!mounted) return;

        setLoggedIn(false);
        setChecking(false);
      }
    };

    checkLogin();

    // =========================
    // 监听登录状态变化
    // =========================
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setLoggedIn(!!session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // 正在检查登录状态
  // =========================
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-slate-400">
          正在检查登录状态...
        </div>
      </div>
    );
  }

  // =========================
  // 没有登录
  // =========================
  if (!loggedIn) {
    return (
      <Login
        onLogin={() => {
          setLoggedIn(true);
        }}
      />
    );
  }

  // =========================
  // 已经登录
  // =========================
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      <Sidebar
        current={view}
        onChange={setView}
      />

      <main className="flex-1 overflow-hidden">

        {view === 'pos' && <POS />}

        {view === 'inventory' && <Inventory />}

        {view === 'reports' && <Reports />}

        {view === 'backup' && <Backup />}

      </main>

    </div>
  );
}
