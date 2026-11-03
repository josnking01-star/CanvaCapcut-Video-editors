import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  Plus, 
  RotateCcw, 
  Tag, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { Order, Invoice, Coupon } from '../../../types';
import { InvoiceModal } from './InvoiceModal';

interface FinanceSalesTabProps {
  showToast: (msg: string) => void;
}

export const FinanceSalesTab: React.FC<FinanceSalesTabProps> = ({ showToast }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view: 'orders' | 'coupons'
  const [subTab, setSubTab] = useState<'orders' | 'coupons'>('orders');

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Commercial Sale Modal State
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleCustName, setSaleCustName] = useState('');
  const [saleCustEmail, setSaleCustEmail] = useState('');
  const [saleEdition, setSaleEdition] = useState('Professional Studio Elite (Yearly)');
  const [saleAmount, setSaleAmount] = useState(1199);
  const [saleMethod, setSaleMethod] = useState<'stripe' | 'paypal' | 'crypto' | 'wire' | 'manual'>('stripe');
  const [saleTier, setSaleTier] = useState<'starter' | 'pro' | 'enterprise'>('pro');

  // New Coupon Modal State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupCode, setNewCoupCode] = useState('');
  const [newCoupType, setNewCoupType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCoupValue, setNewCoupValue] = useState(20);
  const [newCoupMaxUses, setNewCoupMaxUses] = useState(50);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [ordRes, invRes, coupRes] = await Promise.all([
        fetch('/api/owner/finance/orders').then(r => r.json()),
        fetch('/api/owner/finance/invoices').then(r => r.json()),
        fetch('/api/owner/finance/coupons').then(r => r.json()),
      ]);
      if (Array.isArray(ordRes)) setOrders(ordRes);
      if (Array.isArray(invRes)) setInvoices(invRes);
      if (Array.isArray(coupRes)) setCoupons(coupRes);
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleProcessSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleCustName || !saleCustEmail || !saleAmount) return;

    try {
      const res = await fetch('/api/owner/finance/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: saleCustName,
          customerEmail: saleCustEmail,
          editionName: saleEdition,
          amount: saleAmount,
          paymentMethod: saleMethod,
          tier: saleTier,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Sale recorded: $${data.order.amount} from ${data.order.customerName}`);
        setShowSaleModal(false);
        setSaleCustName('');
        setSaleCustEmail('');
        fetchFinanceData();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to process commercial sale');
    }
  };

  const handleRefundOrder = async (orderId: string, orderNum: string) => {
    if (!window.confirm(`Issue full refund for Order ${orderNum}? This will revoke the customer's active license.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/owner/finance/orders/${orderId}/refund`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(`Order ${orderNum} refunded and license revoked`);
        fetchFinanceData();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to refund order');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupCode || !newCoupValue) return;

    try {
      const res = await fetch('/api/owner/finance/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCoupCode,
          discountType: newCoupType,
          discountValue: newCoupValue,
          maxUses: newCoupMaxUses,
        }),
      });

      if (res.ok) {
        showToast(`Coupon ${newCoupCode.toUpperCase()} activated`);
        setShowCouponModal(false);
        setNewCoupCode('');
        fetchFinanceData();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to create coupon');
    }
  };

  const handleToggleCoupon = async (couponId: string) => {
    try {
      const res = await fetch(`/api/owner/finance/coupons/${couponId}/toggle`, { method: 'PUT' });
      if (res.ok) {
        showToast('Coupon status updated');
        fetchFinanceData();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to toggle coupon');
    }
  };

  const handleViewInvoice = (invId: string) => {
    const found = invoices.find(i => i.id === invId);
    if (found) {
      setSelectedInvoice(found);
    } else {
      showToast('Invoice document not found');
    }
  };

  const grossSales = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0);
  const refundAmount = orders.filter(o => o.status === 'refunded').reduce((sum, o) => sum + o.amount, 0);
  const netEarnings = Math.max(0, grossSales - refundAmount);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Sales, Billing & Commercial Financial Center
            </h2>
            <span className="bg-emerald-950 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-emerald-800/60">
              Net ${netEarnings.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track commercial orders, generate official tax invoices, issue refunds with auto-license revocation, and manage promotional coupons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaleModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Process Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Total Gross Orders</span>
          <div className="text-2xl font-black text-white font-mono mt-1">${grossSales.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 font-mono">{orders.length} transactions recorded</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Refunds Issued</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">-${refundAmount.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 font-mono">Automatic key invalidation</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Net Realized Cashflow</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">${netEarnings.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 font-mono">100% Owner Settled</span>
        </div>
      </div>

      {/* Sub Tabs: Orders vs Coupons */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('orders')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            subTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Customer Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setSubTab('coupons')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            subTab === 'coupons' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Coupons & Promos ({coupons.length})</span>
        </button>
      </div>

      {subTab === 'orders' ? (
        /* Orders Registry Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Client / Purchaser</th>
                  <th className="py-3 px-4">Product Edition</th>
                  <th className="py-3 px-4">Amount & Gateway</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                {orders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {ord.orderNumber}
                      <span className="text-[10px] text-slate-500 block font-normal">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-slate-200">{ord.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{ord.customerEmail}</div>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <span className="text-slate-200">{ord.editionName}</span>
                      {ord.licenseKeyGenerated && (
                        <span className="text-[10px] text-indigo-400 font-mono block">
                          Key: {ord.licenseKeyGenerated}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-emerald-400">${ord.amount.toLocaleString()} {ord.currency}</div>
                      <span className="text-[10px] text-slate-500 uppercase">{ord.paymentMethod}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                          ord.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : ord.status === 'refunded'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="capitalize">{ord.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewInvoice(ord.invoiceId)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-colors"
                          title="View Official Invoice"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Invoice</span>
                        </button>

                        {ord.status === 'completed' && (
                          <button
                            onClick={() => handleRefundOrder(ord.id, ord.orderNumber)}
                            className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 rounded text-xs font-semibold border border-amber-800/50 flex items-center gap-1 transition-colors"
                            title="Issue Refund & Revoke Key"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Refund</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Coupons Table */
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCouponModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon Code</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                {coupons.map(coup => (
                  <tr key={coup.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-indigo-300">{coup.code}</td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {coup.discountType === 'percentage' ? `${coup.discountValue}% OFF` : `$${coup.discountValue} FLAT OFF`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {coup.currentUses} / {coup.maxUses}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {coup.validFrom} to {coup.validUntil}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                          coup.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {coup.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <button
                        onClick={() => handleToggleCoupon(coup.id)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                          coup.isActive
                            ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/50'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50'
                        }`}
                      >
                        {coup.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Process Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Record Commercial License Sale</h3>
              </div>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessSale} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Studio"
                  value={saleCustName}
                  onChange={e => setSaleCustName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Email</label>
                <input
                  type="email"
                  required
                  placeholder="billing@apexstudio.com"
                  value={saleCustEmail}
                  onChange={e => setSaleCustEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product Edition</label>
                  <select
                    value={saleTier}
                    onChange={e => {
                      const t = e.target.value as any;
                      setSaleTier(t);
                      if (t === 'starter') {
                        setSaleEdition('Starter Edition (Yearly)');
                        setSaleAmount(399);
                      } else if (t === 'pro') {
                        setSaleEdition('Professional Studio Elite (Yearly)');
                        setSaleAmount(1199);
                      } else {
                        setSaleEdition('Enterprise Agency & Reseller (Lifetime)');
                        setSaleAmount(4999);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="starter">Starter Edition</option>
                    <option value="pro">Pro Studio Elite</option>
                    <option value="enterprise">Enterprise Lifetime</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={saleAmount}
                    onChange={e => setSaleAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={saleMethod}
                  onChange={e => setSaleMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="stripe">Stripe Credit Card</option>
                  <option value="wire">Direct SWIFT Bank Wire</option>
                  <option value="paypal">PayPal Business</option>
                  <option value="crypto">Cryptocurrency (USDT/BTC)</option>
                  <option value="manual">Manual Direct Billing</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
                >
                  Record Sale & Issue Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Create Promotional Coupon</h3>
              </div>
              <button
                onClick={() => setShowCouponModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER30"
                  value={newCoupCode}
                  onChange={e => setNewCoupCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Discount Type</label>
                  <select
                    value={newCoupType}
                    onChange={e => setNewCoupType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Dollar ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={newCoupValue}
                    onChange={e => setNewCoupValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Max Redemptions</label>
                <input
                  type="number"
                  value={newCoupMaxUses}
                  onChange={e => setNewCoupMaxUses(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
                >
                  Activate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
