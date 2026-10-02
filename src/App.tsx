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
      // =========================
      // 1. 检查本机是否有离线营业权限
      // =========================
      const offlineAccess =
        localStorage.getItem(OFFLINE_ACCESS_KEY) === 'true';

      // =========================
      // 2. 如果明确没有网络
      //    不要访问 Supabase
      // =========================
      if (!navigator.onLine) {
        if (!mounted) return;

        if (offlineAccess) {
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }

        setChecking(false);
        return;
      }

      // =========================
      // 3. 有网络时检查 Supabase
      // =========================
      try {
        const sessionPromise = supabase.auth.getSession();

        // 最多等待 5 秒
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 5000);
        });

        const result = await Promise.race([
          sessionPromise,
          timeoutPromise,
        ]);

        if (!mounted) return;

        // Supabase 正常返回 Session
        if (
          result &&
          'data' in result &&
          result.data?.session
        ) {
          setLoggedIn(true);

          // 记录本机已经成功登录过
          localStorage.setItem(
            OFFLINE_ACCESS_KEY,
            'true'
          );
        } else if (offlineAccess) {
          // Supabase 没有 Session，
          // 但本机以前已经成功登录过
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }

        setChecking(false);
      } catch (error) {
        console.error(
          'Supabase 登录状态检查失败:',
          error
        );

        if (!mounted) return;

        // =========================
        // 4. Supabase 访问失败
        //    只要本机有离线权限，
        //    就直接进入 POS
        // =========================
        if (offlineAccess) {
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }

        setChecking(false);
      }
    };

    checkLogin();

    // =========================
    // Supabase 登录状态监听
    // =========================
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

  // =========================
  // 检查登录中
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
          // 登录成功后获得本机离线营业权限
          localStorage.setItem(
            OFFLINE_ACCESS_KEY,
            'true'
          );

          setLoggedIn(true);
        }}
      />
    );
  }

  // =========================
  // POS 主界面
  // =========================
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar
        current={view}
        onChange={setView}
        onLogout={() => {
          // 只退出当前登录账号
          // 不删除本机离线营业权限
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
