import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import POS from '@/views/POS';
import Inventory from '@/views/Inventory';
import Reports from '@/views/Reports';
import Backup from '@/views/Backup';
import Settings from '@/views/Settings';
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
      const offlineAccess =
        localStorage.getItem(OFFLINE_ACCESS_KEY) === 'true';

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

      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error(
            'Supabase Session 检查失败:',
            error
          );

          if (offlineAccess) {
            setLoggedIn(true);
          } else {
            setLoggedIn(false);
          }

          setChecking(false);
          return;
        }

        if (data.session) {
          setLoggedIn(true);

          localStorage.setItem(
            OFFLINE_ACCESS_KEY,
            'true'
          );
        } else {
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

        if (offlineAccess) {
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }

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

        {view === 'settings' && (
          <Settings
            onClose={() => setView('pos')}
          />
        )}
      </main>
    </div>
  );
}
