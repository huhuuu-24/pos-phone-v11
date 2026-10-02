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
      // 读取这台电脑是否已经获得过离线营业权限
      const offlineAccess =
        localStorage.getItem(OFFLINE_ACCESS_KEY) === 'true';

      /*
       * ==========================================
       * 断网状态
       * ==========================================
       *
       * 只要这台电脑以前成功登录过，
       * 断网后直接进入 POS。
       *
       * 完全不访问 Supabase。
       */
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

      /*
       * ==========================================
       * 联网状态
       * ==========================================
       *
       * 联网时正常检查 Supabase Session。
       */
      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error(
            'Supabase Session 检查失败:',
            error
          );

          // 如果以前授权过这台电脑，
          // 即使 Supabase 暂时异常，也允许进入 POS
          if (offlineAccess) {
            setLoggedIn(true);
          } else {
            setLoggedIn(false);
          }

          setChecking(false);
          return;
        }

        if (data.session) {
          // 正常联网登录
          setLoggedIn(true);

          // 第一次成功登录后，
          // 永久记录这台电脑拥有离线营业权限
          localStorage.setItem(
            OFFLINE_ACCESS_KEY,
            'true'
          );
        } else {
          // 没有当前 Session
          // 但如果以前授权过，可以进入 POS
          if (offlineAccess) {
            setLoggedIn(true);
          } else {
            setLoggedIn(false);
          }
        }

        setChecking(false);
      } catch (error) {
        console.error(
          '登录状态检查失败:',
          error
        );

        if (!mounted) return;

        // 网络错误 / Supabase 无法访问
        // 只要这台电脑以前授权过，就允许离线营业
        if (offlineAccess) {
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }

        setChecking(false);
      }
    };

    checkLogin();

    /*
     * 监听 Supabase 登录状态
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        if (session) {
          setLoggedIn(true);

          // 成功登录后记录本机离线权限
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

  /*
   * 正在检查
   */
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-slate-400">
          正在检查登录状态...
        </div>
      </div>
    );
  }

  /*
   * 没有登录
   */
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

  /*
   * POS 主界面
   */
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar
        current={view}
        onChange={setView}
        onLogout={() => {
          /*
           * 注意：
           * 这里只退出当前账号 Session。
           *
           * 不删除：
           * phone-store-pos-offline-access
           *
           * 所以以后断网仍然可以营业。
           */
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
