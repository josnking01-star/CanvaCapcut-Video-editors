import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Tag, 
  Send, 
  Plus, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  MousePointer, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Radio
} from 'lucide-react';
import { MarketingCampaign, NotificationBroadcast } from '../../../types';

interface MarketingBroadcastTabProps {
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const MarketingBroadcastTab: React.FC<MarketingBroadcastTabProps> = ({ showToast }) => {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [broadcasts, setBroadcasts] = useState<NotificationBroadcast[]>([]);
  const [loading, setLoading] = useState(true);

  // New Campaign Form State
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    code: '',
    discountPercent: 20,
    targetGroup: 'All Customers',
    validUntil: '2026-12-31',
  });

  // New Broadcast Form State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    targetAudience: 'all_customers' as 'all_customers' | 'active_subscribers' | 'trial_users' | 'super_admins',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
  });

  const fetchData = async () => {
    try {
      const [campRes, notifRes] = await Promise.all([
        fetch('/api/owner/marketing/campaigns'),
        fetch('/api/owner/notifications/broadcasts'),
      ]);
      const campData = await campRes.json();
      const notifData = await notifRes.json();
      setCampaigns(Array.isArray(campData) ? campData : []);
      setBroadcasts(Array.isArray(notifData) ? notifData : []);
    } catch (err) {
      console.error('Failed to load marketing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.title || !newCampaign.code) {
      showToast('Title and coupon code are required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/owner/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });
      if (res.ok) {
        showToast(`Campaign '${newCampaign.title}' launched successfully!`, 'success');
        setShowCampaignModal(false);
        setNewCampaign({
          title: '',
          code: '',
          discountPercent: 20,
          targetGroup: 'All Customers',
          validUntil: '2026-12-31',
        });
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create campaign', 'error');
      }
    } catch {
      showToast('Server communication error', 'error');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcast.title || !newBroadcast.message) {
      showToast('Title and message are required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/owner/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBroadcast),
      });
      if (res.ok) {
        showToast(`Notification broadcast sent to ${newBroadcast.targetAudience}!`, 'success');
        setShowBroadcastModal(false);
        setNewBroadcast({
          title: '',
          message: '',
          targetAudience: 'all_customers',
          priority: 'normal',
        });
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to send broadcast', 'error');
      }
    } catch {
      showToast('Server communication error', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-mono text-sm">
        Loading Marketing & Broadcast Engines...
      </div>
    );
  }

  const totalCampaignRevenue = campaigns.reduce((acc, c) => acc + (c.revenueGenerated || 0), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Marketing Campaigns & Push Broadcasts
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Launch customer acquisition campaigns, create promotional discount codes, and push real-time broadcasts to desktop clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Campaign</span>
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Push Broadcast</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Active Campaigns</span>
            <Tag className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{campaigns.length}</div>
          <div className="text-[10px] text-indigo-400 font-mono mt-1">Acquisition Promos</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Attributed Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            ${totalCampaignRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1">From Coupon Redemptions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Conversions</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            {totalConversions.toLocaleString()}
          </div>
          <div className="text-[10px] text-purple-400 font-mono mt-1">Paying Customers Acquired</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Broadcasts Sent</span>
            <Radio className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {broadcasts.length}
          </div>
          <div className="text-[10px] text-amber-400 font-mono mt-1">Desktop In-App Alerts</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Active Promotional Campaigns</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{campaigns.length} Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Campaign Title</th>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Target Audience</th>
                <th className="py-3 px-4">Clicks</th>
                <th className="py-3 px-4">Conversions</th>
                <th className="py-3 px-4">Revenue Generated</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {campaigns.map(camp => (
                <tr key={camp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white">{camp.title}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {camp.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{camp.discountPercent}% OFF</td>
                  <td className="py-3.5 px-4 text-slate-400">{camp.targetGroup}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{camp.clicks.toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-300">{camp.conversions.toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    ${camp.revenueGenerated.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{camp.validUntil}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcasts History */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">In-App Desktop Broadcast Log</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{broadcasts.length} Sent</span>
        </div>

        <div className="divide-y divide-slate-800">
          {broadcasts.map(broadcast => (
            <div key={broadcast.id} className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase font-mono ${
                    broadcast.priority === 'urgent'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : broadcast.priority === 'high'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {broadcast.priority}
                  </span>
                  <h4 className="text-sm font-bold text-white">{broadcast.title}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{broadcast.message}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" /> Target: {broadcast.targetAudience}
                  </span>
                  <span>Sent: {new Date(broadcast.sentAt).toLocaleString()}</span>
                  <span>Read Receipts: {broadcast.readCount} users</span>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Delivered</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Create Campaign */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-400" />
              <span>Launch Marketing Campaign</span>
            </h3>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winter Holiday Creator Boost"
                  value={newCampaign.title}
                  onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WINTER30"
                    value={newCampaign.code}
                    onChange={e => setNewCampaign({ ...newCampaign, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Discount %</label>
                  <input
                    type="number"
                    min={5}
                    max={90}
                    value={newCampaign.discountPercent}
                    onChange={e => setNewCampaign({ ...newCampaign, discountPercent: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Customer Group</label>
                <select
                  value={newCampaign.targetGroup}
                  onChange={e => setNewCampaign({ ...newCampaign, targetGroup: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="All Customers">All Customers & Visitors</option>
                  <option value="Trial Users">Expired & Active Free Trial Users</option>
                  <option value="Social Creators">Social Media Creators (TikTok / IG)</option>
                  <option value="Agencies">Marketing Agencies & Teams</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={newCampaign.validUntil}
                  onChange={e => setNewCampaign({ ...newCampaign, validUntil: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  Launch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Push Broadcast */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <span>Broadcast Push Notification</span>
            </h3>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory Client Security Patch v3.0.2"
                  value={newBroadcast.title}
                  onChange={e => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Broadcast Message</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type the message that will pop up on customer desktop applications..."
                  value={newBroadcast.message}
                  onChange={e => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Audience</label>
                  <select
                    value={newBroadcast.targetAudience}
                    onChange={e => setNewBroadcast({ ...newBroadcast, targetAudience: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all_customers">All Customers</option>
                    <option value="active_subscribers">Active Subscribers</option>
                    <option value="trial_users">Trial Users</option>
                    <option value="super_admins">Super Admins Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Urgency Priority</label>
                  <select
                    value={newBroadcast.priority}
                    onChange={e => setNewBroadcast({ ...newBroadcast, priority: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="normal">Normal Information</option>
                    <option value="high">High Alert</option>
                    <option value="urgent">Urgent / Critical Action</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
