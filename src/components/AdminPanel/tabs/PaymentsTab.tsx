import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  DollarSign, 
  Building, 
  Eye, 
  Download,
  AlertCircle
} from 'lucide-react';
import { PaymentTransaction } from '../../../types';

interface PaymentsTabProps {
  showToast: (msg: string) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ showToast }) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([
    {
      id: 'tx_stripe_9001',
      orderId: 'ord_1001',
      customerId: 'cust_seed_01',
      customerName: 'Sarah Jenkins',
      customerEmail: 'sarah.jenkins@mediaflow.io',
      amount: 1199,
      currency: 'USD',
      status: 'completed',
      gateway: 'stripe',
      transactionRef: 'ch_3N19842K0912A',
      createdAt: '2026-10-30T14:20:00Z',
    },
    {
      id: 'tx_wire_9002',
      orderId: 'ord_1002',
      customerId: 'cust_seed_02',
      customerName: 'Marcus Bradley',
      customerEmail: 'marcus@bradleyagency.co',
      amount: 4999,
      currency: 'USD',
      status: 'completed',
      gateway: 'wire',
      transactionRef: 'SWIFT-WIRE-88912-US',
      verifiedBy: 'josnking01@gmail.com',
      createdAt: '2026-10-26T10:15:00Z',
    },
    {
      id: 'tx_jazz_9003',
      orderId: 'ord_1008',
      customerId: 'cust_seed_08',
      customerName: 'Tariq Mehmood',
      customerEmail: 'tariq.mehmood@creativepk.com',
      amount: 149,
      currency: 'USD',
      status: 'pending',
      gateway: 'jazzcash',
      transactionRef: 'JC-PK-98124982',
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
      createdAt: '2026-11-01T08:30:00Z',
    },
    {
      id: 'tx_easy_9004',
      orderId: 'ord_1009',
      customerId: 'cust_seed_09',
      customerName: 'Hamza Khan',
      customerEmail: 'hamza@digistudio.pk',
      amount: 89,
      currency: 'USD',
      status: 'pending',
      gateway: 'easypaisa',
      transactionRef: 'EP-PK-44120912',
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
      createdAt: '2026-11-01T09:45:00Z',
    },
  ]);

  const [selectedProof, setSelectedProof] = useState<PaymentTransaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleApprovePayment = (txId: string) => {
    setPayments(prev =>
      prev.map(p => {
        if (p.id === txId) {
          showToast(`Approved payment ref ${p.transactionRef} - License key activated!`);
          return { ...p, status: 'completed', verifiedBy: 'josnking01@gmail.com' };
        }
        return p;
      })
    );
    if (selectedProof?.id === txId) setSelectedProof(null);
  };

  const handleRejectPayment = (txId: string) => {
    setPayments(prev =>
      prev.map(p => {
        if (p.id === txId) {
          showToast(`Rejected payment transaction ${p.transactionRef}`);
          return { ...p, status: 'rejected', verifiedBy: 'josnking01@gmail.com' };
        }
        return p;
      })
    );
    if (selectedProof?.id === txId) setSelectedProof(null);
  };

  const filteredPayments = payments.filter(p =>
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.transactionRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.gateway.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Payment Gateway Reconciliation & Manual Verification
            </h2>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold">
              Multi-Gateway (Stripe / PayPal / Wire / JazzCash / EasyPaisa)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming gateway settlements, inspect manual bank transfer slips, and authorize software license key dispatches.
          </p>
        </div>
      </div>

      {/* Manual Verification Queue */}
      {payments.some(p => p.status === 'pending') && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Pending Manual Payment Approvals ({payments.filter(p => p.status === 'pending').length})</span>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">Requires Master Owner Authorization</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {payments.filter(p => p.status === 'pending').map(tx => (
              <div key={tx.id} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{tx.customerName}</div>
                  <div className="text-[11px] font-mono text-emerald-400">${tx.amount} {tx.currency} via {tx.gateway.toUpperCase()}</div>
                  <div className="text-[10px] font-mono text-slate-500">Ref: {tx.transactionRef}</div>
                </div>

                <div className="flex items-center gap-2">
                  {tx.proofUrl && (
                    <button
                      onClick={() => setSelectedProof(tx)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-indigo-400" />
                      <span>Slip</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleApprovePayment(tx.id)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectPayment(tx.id)}
                    className="px-2 py-1 bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs rounded border border-red-800/50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Commercial Transactions Ledger</h3>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter by ref, customer, gateway..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Transaction Reference</th>
                <th className="py-3 px-3">Purchaser</th>
                <th className="py-3 px-3">Gateway</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Recorded Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-white font-bold">{p.transactionRef}</td>
                  <td className="py-3 px-3 font-sans">
                    <div className="font-bold text-slate-200">{p.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{p.customerEmail}</div>
                  </td>
                  <td className="py-3 px-3 uppercase text-indigo-300 font-bold">{p.gateway}</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">${p.amount} {p.currency}</td>
                  <td className="py-3 px-3 font-sans">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : p.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Proof Slip Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Manual Payment Slip: {selectedProof.transactionRef}</h3>
              <button onClick={() => setSelectedProof(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="rounded-lg overflow-hidden border border-slate-800 max-h-64 bg-slate-950 flex items-center justify-center">
              <img src={selectedProof.proofUrl} alt="Deposit Slip" className="w-full object-cover" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleRejectPayment(selectedProof.id)}
                className="px-3 py-1.5 bg-red-950 text-red-300 rounded text-xs font-bold"
              >
                Reject Proof
              </button>
              <button
                onClick={() => handleApprovePayment(selectedProof.id)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
              >
                Authorize & Release Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
