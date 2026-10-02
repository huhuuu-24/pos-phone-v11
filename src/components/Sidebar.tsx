import {
  ShoppingCart,
  Package,
  BarChart3,
  Smartphone,
  Database,
  Settings,
  LogOut,
} from 'lucide-react';
import type { View } from '@/types';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  current: View;
  onChange: (v: View) => void;
  onLogout: () => void;
}

const navItems: {
  view: View;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    view: 'pos',
    label: '收银台',
    icon: <ShoppingCart size={20} />,
  },
  {
    view: 'inventory',
    label: '库存管理',
    icon: <Package size={20} />,
  },
  {
    view: 'reports',
    label: '销售报表',
    icon: <BarChart3 size={20} />,
  },
  {
    view: 'backup',
    label: '数据备份',
    icon: <Database size={20} />,
  },
  {
    // 暂时用类型转换，避免影响你现有稳定代码
    view: 'settings' as View,
    label: '店铺设置',
    icon: <Settings size={20} />,
  },
];

export default function Sidebar({
  current,
  onChange,
  onLogout,
}: SidebarProps) {
  const handleLogout = async () => {
    const confirmed = window.confirm(
      '确定要退出登录吗？\n\n退出账号不会影响这台电脑的离线营业功能。'
    );

    if (!confirmed) return;

    try {
      // 只退出当前 Supabase Session
      // 不删除本机离线营业权限
      await supabase.auth.signOut({
        scope: 'local',
      });
    } catch (error) {
      console.error('退出登录失败:', error);
    }

    // 无论有没有网络，都回到登录页面
    onLogout();
  };

  return (
    <aside className="w-60 min-h-screen bg-slate-900 border-r border-slate-700/50 flex flex-col select-none">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700/50">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Smartphone
            size={22}
            className="text-white"
          />
        </div>

        <div>
          <p className="text-white font-bold text-base leading-tight">
            手机店
          </p>

          <p className="text-blue-400 text-xs font-medium">
            POS 系统
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(
          ({ view, label, icon }) => {
            const active = current === view;

            return (
              <button
                key={String(view)}
                onClick={() => onChange(view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {icon}
                {label}
              </button>
            );
          }
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-red-600/20 transition-all duration-200"
        >
          <LogOut size={20} />
          登出
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700/50">
        <p className="text-slate-500 text-xs text-center">
          离线版 · 本地数据存储
        </p>
      </div>
    </aside>
  );
}
