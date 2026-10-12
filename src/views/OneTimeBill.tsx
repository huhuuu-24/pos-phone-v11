import { useState } from 'react';
import {
  Plus,
  Trash2,
  ReceiptText,
  Calculator,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

import { addOrder } from '@/lib/db';
import type { OrderItem, PaymentMethod } from '@/types';

interface BillRow {
  id: number;
  name: string;
  quantity: number;
  costPrice: string;
  sellingPrice: string;
}

function createRow(): BillRow {
  return {
    id: Date.now() + Math.floor(Math.random() * 100000),
    name: '',
    quantity: 1,
    costPrice: '0',
    sellingPrice: '0',
  };
}

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
}[] = [
  { value: 'cash', label: '现金' },
  { value: 'duitnow', label: 'DuitNow / 转账' },
  { value: 'card', label: '银行卡' },
];

export default function OneTimeBill() {
  const [rows, setRows] = useState<BillRow[]>([createRow()]);
  const [billDate, setBillDate] = useState(getLocalDateString());
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cash');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const updateRow = (
    id: number,
    field: keyof Omit<BillRow, 'id'>,
    value: string | number
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
    setSuccessMessage('');
  };

  const addRow = () => {
    setRows((current) => [...current, createRow()]);
    setSuccessMessage('');
  };

  const removeRow = (id: number) => {
    setRows((current) =>
      current.length > 1
        ? current.filter((row) => row.id !== id)
        : current
    );
    setSuccessMessage('');
  };

  const getRowAmount = (row: BillRow) => {
    return row.quantity * (Number(row.sellingPrice) || 0);
  };

  const getRowProfit = (row: BillRow) => {
    return (
      row.quantity *
      ((Number(row.sellingPrice) || 0) -
        (Number(row.costPrice) || 0))
    );
  };

  const totalQuantity = rows.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0),
    0
  );

  const totalAmount = rows.reduce(
    (sum, row) => sum + getRowAmount(row),
    0
  );

  const totalCost = rows.reduce(
    (sum, row) =>
      sum +
      row.quantity * (Number(row.costPrice) || 0),
    0
  );

  const totalProfit = totalAmount - totalCost;

  const resetForm = () => {
    setRows([createRow()]);
    setPaymentMethod('cash');
    setBillDate(getLocalDateString());
    setSuccessMessage('');
  };

  const handleSave = async () => {
    if (saving) return;

    if (rows.some((row) => !row.name.trim())) {
      window.alert('请填写每一个项目的名称。');
      return;
    }

    for (const row of rows) {
      const quantity = Number(row.quantity);
      const costPrice = Number(row.costPrice);
      const sellingPrice = Number(row.sellingPrice);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        row.quantity === ('' as unknown as number)
      ) {
        window.alert('数量必须是大于 0 的整数。');
        return;
      }

      if (
        row.costPrice.trim() === '' ||
        row.sellingPrice.trim() === '' ||
        !Number.isFinite(costPrice) ||
        !Number.isFinite(sellingPrice) ||
        costPrice < 0 ||
        sellingPrice < 0
      ) {
        window.alert('请检查成本价和售价，价格不能是负数或空白。');
        return;
      }
    }

    if (totalAmount <= 0) {
      window.alert('订单总金额必须大于 RM0.00。');
      return;
    }

    const confirmed = window.confirm(
      `确认保存这张一次性订单吗？\n\n` +
        `项目数量：${totalQuantity}\n` +
        `营业额：RM ${totalAmount.toFixed(2)}\n` +
        `成本：RM ${totalCost.toFixed(2)}\n` +
        `利润：RM ${totalProfit.toFixed(2)}\n\n` +
        `此订单不会扣除库存。`
    );

    if (!confirmed) return;

    setSaving(true);
    setSuccessMessage('');

    try {
      const items: OrderItem[] = rows.map((row) => ({
        productId: 0,
        category: 'service',
        imeiId: null,
        imei: '',
        brand: '一次性项目',
        model: row.name.trim(),
        color: '',
        config: '',
        quantity: Number(row.quantity),
        sellingPrice: Number(Number(row.sellingPrice).toFixed(2)),
        costPrice: Number(Number(row.costPrice).toFixed(2)),
        isOneTimeItem: true,
      }));

      await addOrder({
        items,
        paymentMethod,
        totalAmount: Number(totalAmount.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        createdAt: new Date(`${billDate}T12:00:00`).toISOString(),
        orderType: 'one-time',
      });

      setRows([createRow()]);
      setPaymentMethod('cash');
      setSuccessMessage(
        '订单保存成功！请到销售报表检查记录。'
      );
    } catch (error) {
      console.error('保存一次性订单失败:', error);
      window.alert(
        '保存失败，请检查数据库和网络状态后再试。'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-950 p-5 text-white md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">       
<div className="flex flex-wrap items-center justify-between gap-4">
  <div>
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
        <ReceiptText size={26} />
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          一次性开单
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          临时商品或服务，无需建立库存商品
        </p>
      </div>
    </div>

    {/* 开单日期 */}
    <div className="mt-4">
      <label className="mb-2 block text-sm text-slate-400">
        开单日期
      </label>

      <input
        type="date"
        value={billDate}
        onChange={(event) => {
          setBillDate(event.target.value);
          setSuccessMessage('');
        }}
        required
        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      />
    </div>
  </div>

  <button
    type="button"
    onClick={resetForm}
    className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800"
  >
    <ArrowLeft size={17} />
    清空重开
  </button>
</div>

        {successMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
            <CheckCircle size={21} />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-5">
            <div>
              <h2 className="font-semibold">订单项目</h2>
              <p className="mt-1 text-sm text-slate-400">
                成本和售价均按单件填写
              </p>
            </div>

            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              <Plus size={18} />
              添加项目
            </button>
          </div>

          <div className="space-y-4 p-5">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-300">
                    项目 {index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    title="删除项目"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="mb-2 block text-xs text-slate-400">
                      项目名称
                    </label>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(event) =>
                        updateRow(row.id, 'name', event.target.value)
                      }
                      placeholder="例如：换屏、维修费"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-slate-400">
                      数量
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.quantity}
                      onChange={(event) =>
                        updateRow(
                          row.id,
                          'quantity',
                          event.target.value === ''
                            ? ('' as unknown as number)
                            : Number(event.target.value)
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-slate-400">
                      单件成本 (RM)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.costPrice}
                      onChange={(event) =>
                        updateRow(row.id, 'costPrice', event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-slate-400">
                      单件售价 (RM)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.sellingPrice}
                      onChange={(event) =>
                        updateRow(
                          row.id,
                          'sellingPrice',
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-slate-400">
                      项目金额
                    </label>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-3 text-sm font-semibold text-blue-300">
                      RM {getRowAmount(row).toFixed(2)}
                    </div>
                    <p
                      className={`mt-2 text-xs ${
                        getRowProfit(row) < 0
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      利润 RM {getRowProfit(row).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-1">
            <h2 className="mb-4 font-semibold">付款方式</h2>

            <div className="space-y-2">
              {PAYMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentMethod(option.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                    paymentMethod === option.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              此页面保存的是一次性订单，不会新增商品，也不会扣除库存或 IMEI。
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <Calculator size={20} className="text-blue-400" />
              <h2 className="font-semibold">订单结算</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-sm text-slate-400">总数量</p>
                <p className="mt-2 text-2xl font-bold">
                  {totalQuantity}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-sm text-slate-400">总成本</p>
                <p className="mt-2 text-2xl font-bold text-slate-200">
                  RM {totalCost.toFixed(2)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4">
                <p className="text-sm text-slate-400">预计利润</p>
                <p
                  className={`mt-2 text-2xl font-bold ${
                    totalProfit < 0
                      ? 'text-red-400'
                      : 'text-emerald-400'
                  }`}
                >
                  RM {totalProfit.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
              <div>
                <p className="text-sm text-slate-400">
                  应收总额
                </p>
                <p className="mt-1 text-3xl font-bold text-blue-300">
                  RM {totalAmount.toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? '正在保存...' : '确认开单并保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
