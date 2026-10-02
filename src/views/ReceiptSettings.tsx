import { useState } from 'react';
import { Settings, Upload, Trash2, X, Save, Image as ImageIcon } from 'lucide-react';

export interface ReceiptSettingsData {
  shopName: string;
  ssm: string;
  address: string;
  phone: string;
  receiptTitle: string;
  thankYouText: string;
  logoDataUrl: string;
}

export const RECEIPT_SETTINGS_KEY = 'receipt_settings';

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettingsData = {
  shopName: 'DREAM MOBILE ENTERPRISE',
  ssm: '20260365286 (JM041516-D)',
  address: '160, Jalan Pantai, 34350 Kuala Kurau, Perak.',
  phone: '011-25804449',
  receiptTitle: '收银单 / RECEIPT',
  thankYouText: 'Thank you for shopping with us!',
  logoDataUrl: '',
};

export function loadReceiptSettings(): ReceiptSettingsData {
  try {
    const stored = localStorage.getItem(RECEIPT_SETTINGS_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      return {
        ...DEFAULT_RECEIPT_SETTINGS,
        ...parsed,
      };
    }
  } catch {
    // ignore invalid data
  }

  return DEFAULT_RECEIPT_SETTINGS;
}

export function saveReceiptSettings(
  settings: ReceiptSettingsData
) {
  localStorage.setItem(
    RECEIPT_SETTINGS_KEY,
    JSON.stringify(settings)
  );
}

interface ReceiptSettingsProps {
  onClose: () => void;
  onSaved: (settings: ReceiptSettingsData) => void;
}

export default function ReceiptSettings({
  onClose,
  onSaved,
}: ReceiptSettingsProps) {
  const [settings, setSettings] = useState<ReceiptSettingsData>(
    () => loadReceiptSettings()
  );

  const updateField = (
    field: keyof ReceiptSettingsData,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件。');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo 图片不能超过 2MB。');
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

    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const cleaned: ReceiptSettingsData = {
      shopName: settings.shopName.trim(),
      ssm: settings.ssm.trim(),
      address: settings.address.trim(),
      phone: settings.phone.trim(),
      receiptTitle: settings.receiptTitle.trim(),
      thankYouText: settings.thankYouText.trim(),
      logoDataUrl: settings.logoDataUrl,
    };

    if (!cleaned.shopName) {
      alert('请输入店铺名称。');
      return;
    }

    saveReceiptSettings(cleaned);
    onSaved(cleaned);
    alert('收据设置已保存！');
  };

  const handleReset = () => {
    const ok = confirm(
      '确定要恢复收据默认设置吗？'
    );

    if (!ok) return;

    setSettings({
      ...DEFAULT_RECEIPT_SETTINGS,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Settings size={20} className="text-blue-400" />
            </div>

            <div>
              <h3 className="text-white font-semibold text-lg">
                收据设置
              </h3>

              <p className="text-slate-500 text-xs mt-0.5">
                修改后会自动应用到新收据和补印收据
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">

          {/* Logo */}
          <div>
            <label className="text-slate-400 text-sm block mb-2">
              店铺 Logo
            </label>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">

              {settings.logoDataUrl ? (
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center p-2">
                    <img
                      src={settings.logoDataUrl}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      当前 Logo
                    </p>

                    <p className="text-slate-500 text-xs mt-1">
                      Logo 会显示在收据顶部
                    </p>

                    <button
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          logoDataUrl: '',
                        }))
                      }
                      className="mt-3 flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs"
                    >
                      <Trash2 size={14} />
                      删除 Logo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-slate-900 border border-dashed border-slate-600 rounded-xl flex items-center justify-center">
                    <ImageIcon
                      size={28}
                      className="text-slate-600"
                    />
                  </div>

                  <div>
                    <p className="text-slate-300 text-sm">
                      暂无 Logo
                    </p>

                    <p className="text-slate-500 text-xs mt-1">
                      建议使用 PNG / JPG
                    </p>
                  </div>
                </div>
              )}

              <label className="mt-4 flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all">
                <Upload size={16} />
                {settings.logoDataUrl
                  ? '更换 Logo'
                  : '上传 Logo'}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Shop name */}
          <div>
            <label className="text-slate-400 text-sm block mb-2">
              店铺名称
            </label>

            <input
              type="text"
              value={settings.shopName}
              onChange={(e) =>
                updateField('shopName', e.target.value)
              }
              placeholder="例如：DREAM MOBILE ENTERPRISE"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* SSM */}
          <div>
            <label className="text-slate-400 text-sm block mb-2">
              SSM 注册号码
            </label>

            <input
              type="text"
              value={settings.ssm}
              onChange={(e) =>
                updateField('ssm', e.target.value)
              }
              placeholder="例如：20260365286 (JM041516-D)"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-slate-400 text-sm block mb-2">
              店铺地址
            </label>

            <textarea
              value={settings.address}
              onChange={(e) =>
                updateField('address', e.target.value)
              }
              rows={2}
              placeholder="输入店铺地址"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-slate-400 text-sm block mb-2">
              联系电话
            </label>

            <input
              type="text"
              value={settings.phone}
              onChange={(e) =>
                updateField('phone', e.target.value)
              }
              placeholder="例如：011-25804449"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Receipt title */}
          <div>
            <label className="text-slate-400 text-sm block mb-2">
              收据标题
            </label>

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
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Thank you */}
          <div>
            <label className="text-slate-400 text-sm block mb-2">
              收据底部感谢文字
            </label>

            <input
              type="text"
              value={settings.thankYouText}
              onChange={(e) =>
                updateField(
                  'thankYouText',
                  e.target.value
                )
              }
              placeholder="例如：Thank you for shopping with us!"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl p-5 text-black">
            <p className="text-xs text-slate-400 mb-4">
              收据顶部预览
            </p>

            <div className="text-center">
              {settings.logoDataUrl && (
                <img
                  src={settings.logoDataUrl}
                  alt="Logo"
                  className="mx-auto mb-3 max-w-[100px] max-h-[60px] object-contain"
                />
              )}

              <div className="font-bold text-lg">
                {settings.shopName || '店铺名称'}
              </div>

              {settings.ssm && (
                <div className="text-[10px] mt-1 text-slate-600">
                  SSM: {settings.ssm}
                </div>
              )}

              {settings.address && (
                <div className="text-[10px] mt-1 text-slate-600">
                  {settings.address}
                </div>
              )}

              {settings.phone && (
                <div className="text-[10px] mt-1 text-slate-600">
                  Tel: {settings.phone}
                </div>
              )}

              <div className="font-bold text-xs mt-3">
                {settings.receiptTitle || 'RECEIPT'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5 border-t border-slate-700">

          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            <Trash2 size={16} />
            恢复默认
          </button>

          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            <X size={16} />
            取消
          </button>

          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <Save size={16} />
            保存设置
          </button>

        </div>
      </div>
    </div>
  );
}
