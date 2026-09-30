import { useState, useEffect } from 'react';
import { exportDatabase, importDatabase } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { Cloud, Download, Upload, RotateCcw } from 'lucide-react';

type CloudBackup = {
  id: number;
  user_id: string;
  backup_data: any;
  created_at: string;
};

export default function Backup() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [error, setError] = useState('');

  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudBackups, setCloudBackups] = useState<CloudBackup[]>([]);
  const [cloudLoadingList, setCloudLoadingList] = useState(false);

  // =========================
  // 加载云端备份
  // =========================
  const loadCloudBackups = async () => {
    try {
      setCloudLoadingList(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return;
      }

      const { data, error } = await supabase
        .from('pos_backups')
        .select('id, user_id, backup_data, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setCloudBackups(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCloudLoadingList(false);
    }
  };

  useEffect(() => {
    loadCloudBackups();
  }, []);

  // =========================
  // 本地导出
  // =========================
  const handleExport = async () => {
    try {
      const data = await exportDatabase();

      const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: 'application/json' }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download =
        'backup-' +
        new Date().toISOString().slice(0, 10) +
        '.json';

      a.click();

      URL.revokeObjectURL(url);

      alert('本地备份成功');
    } catch (err) {
      console.error(err);
      alert('备份失败，请重试');
    }
  };

  // =========================
  // 云端备份
  // =========================
  const handleCloudBackup = async () => {
    if (cloudLoading) return;

    try {
      setCloudLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('登录状态已失效，请重新登录');
        return;
      }

      const backupData = await exportDatabase();

      const { error } = await supabase
        .from('pos_backups')
        .insert({
          user_id: user.id,
          backup_data: backupData,
        });

      if (error) {
        console.error(error);
        alert('云端备份失败：' + error.message);
        return;
      }

      alert('☁️ 云端备份成功');

      // 备份成功后重新加载记录
      await loadCloudBackups();
    } catch (err) {
      console.error(err);
      alert('云端备份失败，请重试');
    } finally {
      setCloudLoading(false);
    }
  };

  // =========================
  // 云端恢复
  // =========================
  const handleCloudRestore = async (backup: CloudBackup) => {
    const data = backup.backup_data;

    if (
      !data ||
      data.version !== 1 ||
      !Array.isArray(data.products) ||
      !Array.isArray(data.imeis) ||
      !Array.isArray(data.orders)
    ) {
      alert('这个云端备份数据无效');
      return;
    }

    const backupDate = new Date(
      backup.created_at
    ).toLocaleString();

    const confirmed = window.confirm(
      `确定要恢复这个云端备份吗？\n\n` +
      `备份时间：${backupDate}\n` +
      `商品：${data.products.length}\n` +
      `IMEI：${data.imeis.length}\n` +
      `订单：${data.orders.length}\n\n` +
      `⚠️ 恢复后会覆盖当前电脑里的所有 POS 数据。`
    );

    if (!confirmed) return;

    try {
      await importDatabase(data);

      alert('云端备份恢复成功！POS 系统将重新加载。');

      location.reload();
    } catch (err) {
      console.error(err);
      alert('云端恢复失败，请重试');
    }
  };

  // =========================
  // 本地选择备份
  // =========================
  const handleImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError('');
    setBackupInfo(null);
    setSelectedFile(file);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (
        data.version !== 1 ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.imeis) ||
        !Array.isArray(data.orders)
      ) {
        throw new Error('invalid');
      }

      setBackupInfo({
        date: data.exportDate,
        products: data.products.length,
        imeis: data.imeis.length,
        orders: data.orders.length,
        data,
      });
    } catch (err) {
      console.error(err);
      setSelectedFile(null);
      setError('这个文件不是有效的手机店 POS 备份文件');
    }

    e.target.value = '';
  };

  // =========================
  // 本地恢复
  // =========================
  const handleRestore = async () => {
    if (!backupInfo || !selectedFile) return;

    const confirmed = window.confirm(
      '恢复备份会覆盖当前所有商品、IMEI和订单数据。\n\n确定要恢复这个备份吗？'
    );

    if (!confirmed) return;

    try {
      await importDatabase(backupInfo.data);

      alert('恢复成功！POS 系统将重新加载。');

      location.reload();
    } catch (err) {
      console.error(err);
      alert('恢复失败，请检查备份文件后重试');
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">

        <h2 className="text-2xl font-bold text-white mb-8">
          数据备份
        </h2>

        {/* ========================= */}
        {/* 云端备份 */}
        {/* ========================= */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 mb-6">

          <h3 className="text-white text-lg font-semibold mb-2 flex items-center gap-2">
            <Cloud size={20} className="text-blue-400" />
            云端备份
          </h3>

          <p className="text-slate-400 text-sm mb-5">
            将当前 POS 的商品、IMEI和历史订单安全备份到云端。
          </p>

          <button
            onClick={handleCloudBackup}
            disabled={cloudLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Upload size={18} />
            {cloudLoading
              ? '正在备份...'
              : '立即备份到云端'}
          </button>

        </div>

        {/* ========================= */}
        {/* 云端备份记录 */}
        {/* ========================= */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 mb-6">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h3 className="text-white text-lg font-semibold">
                云端备份记录
              </h3>

              <p className="text-slate-400 text-sm mt-1">
                选择一个备份，可以恢复到当前电脑。
              </p>
            </div>

            <button
              onClick={loadCloudBackups}
              disabled={cloudLoadingList}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 text-sm"
            >
              {cloudLoadingList
                ? '读取中...'
                : '刷新'}
            </button>

          </div>

          {cloudBackups.length === 0 ? (

            <div className="text-center py-10 text-slate-500">
              目前没有云端备份
            </div>

          ) : (

            <div className="space-y-3">

              {cloudBackups.map((backup) => {

                const data = backup.backup_data;

                return (
                  <div
                    key={backup.id}
                    className="bg-slate-800 rounded-xl p-5 border border-slate-700"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div className="flex-1">

                        <div className="text-white font-medium">
                          {new Date(
                            backup.created_at
                          ).toLocaleString()}
                        </div>

                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">

                          <span>
                            商品：
                            <span className="text-slate-200 ml-1">
                              {data?.products?.length ?? 0}
                            </span>
                          </span>

                          <span>
                            IMEI：
                            <span className="text-slate-200 ml-1">
                              {data?.imeis?.length ?? 0}
                            </span>
                          </span>

                          <span>
                            订单：
                            <span className="text-slate-200 ml-1">
                              {data?.orders?.length ?? 0}
                            </span>
                          </span>

                        </div>

                      </div>

                      <button
                        onClick={() =>
                          handleCloudRestore(backup)
                        }
                        className="px-5 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-medium flex items-center gap-2"
                      >
                        <RotateCcw size={18} />
                        恢复
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </div>

        {/* ========================= */}
        {/* 本地导出 */}
        {/* ========================= */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 mb-6">

          <h3 className="text-white text-lg font-semibold mb-2 flex items-center gap-2">
            <Download size={20} className="text-green-400" />
            本地备份
          </h3>

          <p className="text-slate-400 text-sm mb-5">
            将商品、IMEI和历史订单保存到电脑。
          </p>

          <button
            onClick={handleExport}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium"
          >
            导出备份
          </button>

        </div>

        {/* ========================= */}
        {/* 本地恢复 */}
        {/* ========================= */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">

          <h3 className="text-white text-lg font-semibold mb-2">
            恢复本地备份
          </h3>

          <p className="text-slate-400 text-sm mb-5">
            选择之前导出的 POS 备份文件。
          </p>

          <label className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium cursor-pointer">

            选择备份文件

            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

          </label>

          {error && (
            <div className="mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {backupInfo && (
            <div className="mt-6 bg-slate-800 rounded-xl p-5">

              <p className="text-white font-medium mb-4">
                已选择备份文件
              </p>

              <div className="space-y-2 text-sm">

                <div className="flex justify-between">
                  <span className="text-slate-400">
                    文件
                  </span>

                  <span className="text-slate-200">
                    {selectedFile?.name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">
                    备份日期
                  </span>

                  <span className="text-slate-200">
                    {new Date(
                      backupInfo.date
                    ).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">
                    商品
                  </span>

                  <span className="text-slate-200">
                    {backupInfo.products}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">
                    IMEI
                  </span>

                  <span className="text-slate-200">
                    {backupInfo.imeis}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">
                    订单
                  </span>

                  <span className="text-slate-200">
                    {backupInfo.orders}
                  </span>
                </div>

              </div>

              <button
                onClick={handleRestore}
                className="mt-6 w-full px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-medium"
              >
                确认恢复此备份
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
