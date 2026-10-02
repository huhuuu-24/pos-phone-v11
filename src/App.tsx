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
        const offlineAccess =
          localStorage.getItem(OFFLINE_ACCESS_KEY) === 'true';

        const isOnline = navigator.onLine;

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        // 有有效 Supabase Session
        if (session) {
          setLoggedIn(true);

          // 记录这台电脑已经获得过离线营业权限
          localStorage.setItem(
            OFFLINE_ACCESS_KEY,
            'true'
          );
        }

        // 没网络 + 以前成功登录过
        else if (!isOnline && offlineAccess) {
          // 允许离线进入 POS
          setLoggedIn(true);
        }

        // 有网络但已经登出
        else {
          setLoggedIn(false);
        }

        setChecking(false);
      } catch (error) {
        console.error('检查登录状态失败:', error);

        if (!mounted) return;

        const offlineAccess =
          localStorage.getItem(OFFLINE_ACCESS_KEY) === 'true';

        // 如果检查 Supabase 失败，同时本机有离线授权
        // 就允许进入 POS
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
          // 登录成功后，记录本机离线营业权限
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
          // 注意：
          // 登出账号，但不删除本机离线营业权限
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
