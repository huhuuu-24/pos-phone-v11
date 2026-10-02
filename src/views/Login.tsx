import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LogIn, WifiOff } from 'lucide-react';

const SAVED_EMAIL_KEY = 'phone-store-pos-email';
const OFFLINE_ACCESS_KEY = 'phone-store-pos-offline-access';

export default function Login({
  onLogin,
}: {
  onLogin: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offlineAvailable, setOfflineAvailable] =
    useState(false);

  useEffect(() => {
    const savedEmail =
      localStorage.getItem(SAVED_EMAIL_KEY);

    if (savedEmail) {
      setEmail(savedEmail);
    }

    const offlineAccess =
      localStorage.getItem(OFFLINE_ACCESS_KEY) ===
      'true';

    setOfflineAvailable(offlineAccess);
  }, []);

  /*
   * 正常联网登录
   */
  const handleLogin = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      /*
       * 登录成功
       */

      if (rememberEmail) {
        localStorage.setItem(
          SAVED_EMAIL_KEY,
          email
        );
      } else {
        localStorage.removeItem(
          SAVED_EMAIL_KEY
        );
      }

      /*
       * 记录：
       * 这台电脑已经获得离线营业权限
       */
      localStorage.setItem(
        OFFLINE_ACCESS_KEY,
        'true'
      );

      setLoading(false);

      onLogin();
    } catch (error) {
      console.error(
        '登录失败:',
        error
      );

      setLoading(false);

      setError(
        '无法连接服务器，请检查网络连接。'
      );
    }
  };

  /*
   * 离线进入 POS
   */
  const handleOfflineLogin = () => {
    const offlineAccess =
      localStorage.getItem(OFFLINE_ACCESS_KEY) ===
      'true';

    if (!offlineAccess) {
      setError(
        '这台电脑还没有获得离线营业权限，请先联网登录一次。'
      );
      return;
    }

    setError('');

    onLogin();
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
            <LogIn
              size={28}
              className="text-white"
            />
          </div>

          <h1 className="text-2xl font-bold text-white">
            Phone Store POS
          </h1>

          <p className="mt-2 text-slate-400">
            云端账号登录
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              邮箱
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="请输入邮箱"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              密码
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
              placeholder="请输入密码"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) =>
                setRememberEmail(
                  e.target.checked
                )
              }
              className="h-4 w-4"
            />

            <span>记住邮箱</span>
          </label>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? '登录中...'
              : '联网登录'}
          </button>

          {offlineAvailable && (
            <>
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-slate-800" />

                <span className="text-xs text-slate-500">
                  或
                </span>

                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <button
                onClick={handleOfflineLogin}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3 font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                <WifiOff size={18} />

                离线进入 POS
              </button>

              <p className="text-center text-xs text-slate-500">
                这台电脑已经获得离线营业权限
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
