import { useEffect, useState } from 'react';
import {
  Store,
  FileText,
  MapPin,
  Phone,
  Receipt,
  Image as ImageIcon,
  Upload,
  Trash2,
  Save,
  X,
  MessageSquare,
} from 'lucide-react';

export interface ReceiptSettings {
  shopName: string;
  ssm: string;
  address: string;
  phone: string;
  receiptTitle: string;
  thankYouText: string;
  logoDataUrl: string;
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  shopName: 'DREAM MOBILE ENTERPRISE',
  ssm: '20260365286 (JM041516-D)',
  address: '160, Jalan Pantai, 34350 Kuala Kurau, Perak.',
  phone: '011-25804449',
  receiptTitle: '收银单 / RECEIPT',
  thankYouText: 'Thank you for shopping with us!',
  logoDataUrl: '',
};

export const RECEIPT_SETTINGS_KEY = 'receipt_settings';

export function loadReceiptSettings(): ReceiptSettings {
  try {
    const stored = localStorage.getItem(
      RECEIPT_SETTINGS_KEY
    );

    if (stored) {
      const parsed = JSON.parse(stored);

      return {
        ...DEFAULT_RECEIPT_SETTINGS,
        ...parsed,
      };
    }
  } catch {
    // 如果资料读取失败，就使用默认设置
  }

  return DEFAULT_RECEIPT_SETTINGS;
}

export function saveReceiptSettings(
  settings: ReceiptSettings
): void {
  localStorage.setItem(
    RECEIPT_SETTINGS_KEY,
    JSON.stringify(settings)
  );
}

interface SettingsProps {
  onClose: () => void;
  onSaved?: (settings: ReceiptSettings) => void;
}

export default function Settings({
  onClose,
  onSaved,
}: SettingsProps) {
  const [settings, setSettings] =
    useState<ReceiptSettings>(
      DEFAULT_RECEIPT_SETTINGS
    );

  const [logoError, setLogoError] =
    useState('');

  useEffect(() => {
    setSettings(loadReceiptSettings());
  }, []);

  const updateField = (
    field: keyof ReceiptSettings,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setLogoError('');

    // 限制图片大小，避免 LocalStorage 被过大的图片占满
    if (file.size > 1024 * 1024) {
      setLogoError(
        'Logo 图片太大，请选择 1MB 以内的图片。'
      );

      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setLogoError(
        '请选择 PNG、JPG、JPEG 等图片文件。'
      );

      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === 'string') {
        setSettings((prev) => ({
          ...prev,
          logoDataUrl: result,
        }));
      }
    };

    reader.onerror = () => {
      setLogoError('Logo 读取失败，请重新选择图片。');
    };

    reader.readAsDataURL(file);

    event.target.value = '';
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({
      ...prev,
      logoDataUrl: '',
    }));

    setLogoError('');
  };

  const handleSave = () => {
    const cleanedSettings: ReceiptSettings = {
      shopName: settings.shopName.trim(),
      ssm: settings.ssm.trim(),
      address: settings.address.trim(),
      phone: settings.phone.trim(),
      receiptTitle: settings.receiptTitle.trim(),
      thankYouText: settings.thankYouText.trim(),
      logoDataUrl: settings.logoDataUrl,
    };

    saveReceiptSettings(cleanedSettings);

    onSaved?.(cleanedSettings);

    alert('店铺设置已保存！');

    onClose();
  };

  const handleReset = () => {
    const ok = confirm(
      '确定要恢复默认店铺资料吗？\n\nLogo 也会被删除。'
    );

    if (!ok) return;

    setSettings({
      ...DEFAULT_RECEIPT_SETTINGS,
    });

    setLogoError('');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700/70 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/70">
          <div>
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <Store
                size={21}
                className="text-blue-400"
              />
              店铺设置
            </h2>

            <p className="text-slate-500 text-sm mt-1">
              设置收据上显示的店铺资料
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Basic shop information */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Store
                size={17}
                className="text-blue-400"
              />
              店铺资料
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Shop name */}
              <div className="md:col-span-2">
                <label className="block text-slate-400 text-sm mb-2">
                  店铺名称
                </label>

                <div className="relative">
                  <Store
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    value={settings.shopName}
                    onChange={(e) =>
                      updateField(
                        'shopName',
                        e.target.value
                      )
                    }
                    placeholder="例如：DREAM MOBILE ENTERPRISE"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* SSM */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  SSM
                </label>

                <div className="relative">
                  <FileText
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    value={settings.ssm}
                    onChange={(e) =>
                      updateField(
                        'ssm',
                        e.target.value
                      )
                    }
                    placeholder="SSM 注册号码"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  电话号码
                </label>

                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) =>
                      updateField(
                        'phone',
                        e.target.value
                      )
                    }
                    placeholder="例如：011-25804449"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-slate-400 text-sm mb-2">
                  店铺地址
                </label>

                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-3.5 text-slate-500"
                  />

                  <textarea
                    value={settings.address}
                    onChange={(e) =>
                      updateField(
                        'address',
                        e.target.value
                      )
                    }
                    placeholder="店铺完整地址"
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Receipt settings */}
          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Receipt
                size={17}
                className="text-blue-400"
              />
              收据设置
            </h3>

            <div className="space-y-4">

              {/* Receipt title */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  收据标题
                </label>

                <div className="relative">
                  <Receipt
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    value={settings.receiptTitle}
                    onChange={(e) =>
                      updateField(
                        'receiptTitle',
                        e.target.value
                      )
                    }
                    placeholder="例如：收银单 / RECEIPT"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Thank you */}
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  收据底部文字
                </label>

                <div className="relative">
                  <MessageSquare
                    size={16}
                    className="absolute left-3 top-3.5 text-slate-500"
                  />

                  <textarea
                    value={settings.thankYouText}
                    onChange={(e) =>
                      updateField(
                        'thankYouText',
                        e.target.value
                      )
                    }
                    placeholder="例如：Thank you for shopping with us!"
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Logo */}
          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <ImageIcon
                size={17}
                className="text-blue-400"
              />
              店铺 Logo
            </h3>

            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">

              {settings.logoDataUrl ? (
                <div className="flex flex-col items-center">

                  <div className="bg-white rounded-xl p-4 mb-4 min-h-[120px] min-w-[180px] flex items-center justify-center">
                    <img
                      src={settings.logoDataUrl}
                      alt="Shop Logo"
                      className="max-w-[220px] max-h-[120px] object-contain"
                    />
                  </div>

                  <p className="text-green-400 text-sm mb-4">
                    Logo 已保存
                  </p>

                  <div className="flex gap-3">

                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-all">
                      <Upload size={16} />
                      更换 Logo

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl text-sm font-semibold transition-all"
                    >
                      <Trash2 size={16} />
                      删除 Logo
                    </button>

                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">

                  <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-4">
                    <ImageIcon
                      size={36}
                      className="text-slate-600"
                    />
                  </div>

                  <p className="text-slate-300 font-medium">
                    尚未上传 Logo
                  </p>

                  <p className="text-slate-500 text-xs mt-1 mb-4">
                    支持 PNG、JPG、JPEG、WEBP，最大 1MB
                  </p>

                  <label className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-bold transition-all">
                    <Upload size={16} />
                    上传 Logo

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                </div>
              )}

              {logoError && (
                <div className="mt-4 text-center text-red-400 text-sm">
                  {logoError}
                </div>
              )}

            </div>

            <p className="text-slate-600 text-xs mt-3">
              Logo 会保存在这台电脑的 POS 设置中，之后打印收据时会自动使用。
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-700/70 flex items-center justify-between gap-3">

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-all"
          >
            <RefreshCwIcon />
            恢复默认
          </button>

          <div className="flex gap-3">

            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all"
            >
              <X size={16} />
              取消
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              <Save size={16} />
              保存设置
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}

function RefreshCwIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    </svg>
  );
}
