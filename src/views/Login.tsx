import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LogIn } from 'lucide-react';

const SAVED_EMAIL_KEY = 'phone-store-pos-email';

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

  // 读取之前记住的邮箱
  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);

    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // 只保存邮箱，不保存密码
    if (rememberEmail) {
      localStorage.setItem(SAVED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }

    onLogin();
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
            <LogIn size={28} className="text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white">
            Phone Store POS
          </h1>

          <p className="mt-2 text-slate-400">
            云端账号登录
          </p>
        </div>

        <div className="space-y-4">

          {/* 邮箱 */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              邮箱
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              密码
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
              placeholder="请输入密码"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* 记住邮箱 */}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) =>
                setRememberEmail(e.target.checked)
              }
              className="h-4 w-4"
            />

            <span>记住邮箱</span>
          </label>

          {/* 错误提示 */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>

        </div>
      </div>
    </div>
  );
}
