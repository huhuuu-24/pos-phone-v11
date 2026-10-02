import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import POS from '@/views/POS';
import Inventory from '@/views/Inventory';
import Reports from '@/views/Reports';
import Backup from '@/views/Backup';
import Login from '@/views/Login';
import { supabase } from '@/lib/supabase';
import type { View } from '@/types';

const OFFLINE_ACCESS_KEY = 'phone-store-pos-offline-access';

export default function App() {
  const [view, setView] = useState<View>('pos');
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkLogin = async () => {
      try {
        // 先检查本机是否已经成功登录过
        const offlineAccess =
          localStorage.getItem(OFFLINE_ACCESS_KEY) === 'true';

        // 检查 Supabase 当前 Session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          // 有有效 Session
          setLoggedIn(true);

          // 确保这台电脑拥有离线使用权限
          localStorage.setItem(
            OFFLINE_ACCESS_KEY,
            'true'
          );
        } else if (offlineAccess) {
          // 没有 Session，但这台电脑之前成功登录过
          // 允许离线进入 POS
          setLoggedIn(true);
        } else {
          // 从来没有登录过
          setLoggedIn(false);
        }

        setChecking(false);
      } catch (error) {
        console.error('检查登录状态失败:', error);

        if (!mounted) return;

        // 即使 Supabase 检查失败，
        // 只要这台电脑以前成功登录过，就允许离线使用
        const offlineAccess =
          localStorage.getItem(OFFLINE_ACCESS_KEY) === 'true';

        setLoggedIn(offlineAccess);
        setChecking(false);
      }
    };

    checkLogin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        if (session) {
          setLoggedIn(true);

          localStorage.setItem(
            OFFLINE_ACCESS_KEY,
            'true'
          );
        }
      }
    );

    return () => {
      mounted = false;
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
    return (
      <Login
        onLogin={() => {
          localStorage.setItem(
            OFFLINE_ACCESS_KEY,
            'true'
          );

          setLoggedIn(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar
        current={view}
        onChange={setView}
         onLogout={() => {
    setLoggedIn(false);
  }}
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
