import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  UserCheck,
  Search,
  RotateCcw,
  Save,
  ArrowRight
} from 'lucide-react';
import { 
  SubscriptionPlan, 
  CustomerSubscription, 
  PricingHistoryRecord 
} from '../../../types';
import { 
  calculateSubscriptionRenewalPrice, 
  calculateNewPurchasePrice, 
  executeGlobalPlanPriceUpdate 
} from '../../../utils/pricingEngine';

interface PriceLockTabProps {
  showToast: (msg: string) => void;
}

export const PriceLockTab: React.FC<PriceLockTabProps> = ({ showToast }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([
    {
      id: 'plan_starter',
      name: 'Starter Creator Edition',
      billingCycle: 'monthly',
      currentPrice: 49,
      previousPrice: 39,
      currency: 'USD',
      effectiveDate: '2026-01-01',
      version: 1,
      status: 'active',
      description: 'Single workstation, 1080p rendering',
      gracePeriodDays: 7,
      tier: 'starter',
    },
    {
      id: 'plan_pro',
      name: 'Professional Studio Elite',
      billingCycle: 'monthly',
      currentPrice: 149,
      previousPrice: 99,
      currency: 'USD',
      effectiveDate: '2026-06-01',
      version: 2,
      status: 'active',
      description: '5 workstations, 4K export, bulk automation, freshness vault',
      gracePeriodDays: 7,
      tier: 'pro',
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise Agency & Reseller',
      billingCycle: 'yearly',
      currentPrice: 2999,
      previousPrice: 2499,
      currency: 'USD',
      effectiveDate: '2026-01-01',
      version: 1,
      status: 'active',
      description: '25 workstations, white-label, priority SLA',
      gracePeriodDays: 14,
      tier: 'enterprise',
    },
  ]);

  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([
    {
      id: 'sub_sarah_01',
      customerId: 'cust_seed_01',
      customerName: 'Sarah Jenkins',
      customerEmail: 'sarah.jenkins@mediaflow.io',
      planId: 'plan_pro',
      planName: 'Professional Studio Elite',
      agreedPrice: 99, // Grandfathered at early adopter price!
      currentStandardPrice: 149,
      isPriceLocked: true,
      priceLockType: 'grandfathered',
      billingCycle: 'monthly',
      status: 'active',
      autoRenew: true,
      startDate: '2025-10-15',
      renewalDate: '2026-11-15',
      currency: 'USD',
    },
    {
      id: 'sub_marcus_02',
      customerId: 'cust_seed_02',
      customerName: 'Marcus Bradley',
      customerEmail: 'marcus@bradleyagency.co',
      planId: 'plan_enterprise',
      planName: 'Enterprise Agency & Reseller',
      agreedPrice: 2499, // Grandfathered
      currentStandardPrice: 2999,
      isPriceLocked: true,
      priceLockType: 'lifetime',
      billingCycle: 'yearly',
      status: 'active',
      autoRenew: true,
      startDate: '2025-12-01',
      renewalDate: '2026-12-01',
      currency: 'USD',
    },
    {
      id: 'sub_liam_03',
      customerId: 'cust_seed_04',
      customerName: 'Dr. Liam Vance',
      customerEmail: 'liam.vance@medcontent.org',
      planId: 'plan_starter',
      planName: 'Starter Creator Edition',
      agreedPrice: 49,
      currentStandardPrice: 49,
      isPriceLocked: true,
      priceLockType: '1_year',
      priceLockExpiresAt: '2027-01-01',
      billingCycle: 'monthly',
      status: 'active',
      autoRenew: true,
      startDate: '2026-01-01',
      renewalDate: '2026-12-01',
      currency: 'USD',
    },
  ]);

  const [history, setHistory] = useState<PricingHistoryRecord[]>([
    {
      id: 'prc_hist_01',
      planId: 'plan_pro',
      planName: 'Professional Studio Elite',
      previousPrice: 99,
      newPrice: 149,
      currency: 'USD',
      effectiveDate: '2026-06-01',
      changedBy: 'josnking01@gmail.com',
      reason: 'Integrated Google Flow AI & 15-Day Viral Freshness Vault',
      approvedByOwner: true,
    },
  ]);

  // Global Price Update Modal State
  const [selectedPlanId, setSelectedPlanId] = useState('plan_pro');
  const [newPriceInput, setNewPriceInput] = useState<number>(179);
  const [priceChangeReason, setPriceChangeReason] = useState('Expansion of 8K multi-platform GPU rendering engine');
  const [searchQuery, setSearchQuery] = useState('');

  const handleExecutePriceUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPlan = plans.find(p => p.id === selectedPlanId);
    if (!targetPlan) return;

    const result = executeGlobalPlanPriceUpdate(
      targetPlan,
      Number(newPriceInput),
      priceChangeReason,
      'josnking01@gmail.com',
      subscriptions
    );

    setPlans(prev => prev.map(p => (p.id === targetPlan.id ? result.updatedPlan : p)));
    setHistory(prev => [result.historyRecord, ...prev]);

    showToast(
      `Updated ${targetPlan.name} to $${newPriceInput}/mo. Protected ${result.affectedSubscriptionsPreservedCount} existing subscriptions at their agreed rate!`
    );
  };

  const handleTogglePriceLock = (subId: string) => {
    setSubscriptions(prev =>
      prev.map(s => {
        if (s.id === subId) {
          const nextLock = !s.isPriceLocked;
          showToast(`Price lock for ${s.customerName} set to ${nextLock ? 'LOCKED' : 'UNLOCKED'}`);
          return { ...s, isPriceLocked: nextLock };
        }
        return s;
      })
    );
  };

  const filteredSubs = subscriptions.filter(s =>
    s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.planName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Advanced Price Lock & Grandfathered Pricing Engine
            </h2>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
              Part 11 Compliance Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforces supreme commercial rule: <strong>New subscription purchase = latest active price. Existing subscription renewal = protected agreed price by default.</strong>
          </p>
        </div>
      </div>

      {/* Mandatory Business Rule Infographic Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-amber-950/40 border border-indigo-500/30 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Rule A: Existing Customer Renewal Protection</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            When you increase a plan's public price, existing active subscribers automatically keep their original agreed price upon auto-renewal. Global price updates never silently hike renewal costs without authorization.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <ArrowRight className="w-4 h-4" />
            <span>Rule B: New Purchase = Latest Active Price</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Any customer purchasing their first subscription or an existing customer buying a completely new plan after the effective date pays the latest active standard price.
          </p>
        </div>
      </div>

      {/* Global Price Update Action Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Publish New Global Plan Price (Grandfather Protected)</h3>
        </div>

        <form onSubmit={handleExecutePriceUpdate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Target Plan</label>
            <select
              value={selectedPlanId}
              onChange={e => setSelectedPlanId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: ${p.currentPrice})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">New Active Price ($ USD)</label>
            <input
              type="number"
              required
              min={1}
              value={newPriceInput}
              onChange={e => setNewPriceInput(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Audit Justification / Reason</label>
            <input
              type="text"
              required
              value={priceChangeReason}
              onChange={e => setPriceChangeReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Publish New Price</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Customer Subscriptions with Price Lock Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Active Customer Subscriptions & Price Locks ({subscriptions.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Customers with active price locks pay their agreed price indefinitely or for their locked duration.
            </p>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search subscriber..."
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
                <th className="py-3 px-3">Subscriber</th>
                <th className="py-3 px-3">Plan Name</th>
                <th className="py-3 px-3">Agreed Price (Locked)</th>
                <th className="py-3 px-3">Standard Public Price</th>
                <th className="py-3 px-3">Savings vs Public</th>
                <th className="py-3 px-3">Lock Policy</th>
                <th className="py-3 px-3 text-right">Lock Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
              {filteredSubs.map(sub => {
                const plan = plans.find(p => p.id === sub.planId);
                const renewalCalc = plan ? calculateSubscriptionRenewalPrice(sub, plan) : null;

                return (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-white">{sub.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sub.customerEmail}</div>
                    </td>

                    <td className="py-3 px-3 font-sans text-slate-200">
                      {sub.planName}
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">
                        Cycle: {sub.billingCycle}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      ${sub.agreedPrice} / {sub.billingCycle}
                    </td>

                    <td className="py-3 px-3 text-slate-400">
                      ${plan?.currentPrice || sub.currentStandardPrice} / {sub.billingCycle}
                    </td>

                    <td className="py-3 px-3">
                      {renewalCalc && renewalCalc.savingsVsStandard > 0 ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                          Save ${renewalCalc.savingsVsStandard} / cycle
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Standard</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 font-sans uppercase">
                        {sub.isPriceLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-slate-500" />}
                        {sub.priceLockType}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-sans">
                      <button
                        onClick={() => handleTogglePriceLock(sub.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                          sub.isPriceLocked
                            ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/50'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/50'
                        }`}
                      >
                        {sub.isPriceLocked ? 'Unlock Price' : 'Lock Price'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing History Audit Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <History className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Pricing Adjustment History Audit Ledger</h3>
        </div>

        <div className="space-y-2">
          {history.map(item => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
            >
              <div>
                <span className="font-bold text-white font-sans">{item.planName}: </span>
                <span className="text-slate-500">${item.previousPrice}</span>
                <span className="text-slate-400 mx-1">→</span>
                <span className="text-emerald-400 font-bold">${item.newPrice}</span>
                <span className="text-slate-500 ml-2">({item.effectiveDate})</span>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">{item.reason}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-indigo-300">By: {item.changedBy}</span>
                <span className="text-[10px] text-emerald-400 block">Owner Approved</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
