import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  ShieldCheck, 
  X,
  Filter,
  RefreshCw
} from 'lucide-react';
import { SupportTicket, SupportTicketMessage } from '../../../types';
import { MASTER_OWNER_EMAIL } from '../../../utils/rbac';

interface CustomerSupportTabProps {
  showToast: (msg: string) => void;
}

export const CustomerSupportTab: React.FC<CustomerSupportTabProps> = ({ showToast }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/owner/support/tickets');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
        if (selectedTicket) {
          const refreshed = data.find(t => t.id === selectedTicket.id);
          if (refreshed) setSelectedTicket(refreshed);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/owner/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText.trim(),
          senderName: 'Master Owner Executive Support',
          senderRole: 'Master Owner',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Reply dispatched to customer ticket');
        setReplyText('');
        fetchTickets();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to post reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, nextStatus: SupportTicket['status']) => {
    try {
      const res = await fetch(`/api/owner/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        showToast(`Ticket status updated to ${nextStatus}`);
        fetchTickets();
      }
    } catch (err: unknown) {
      console.error(err);
      showToast('Failed to update status');
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Customer Support Desk & Ticket Resolution
            </h2>
            <span className="bg-indigo-950 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-indigo-800/60">
              {tickets.filter(t => t.status !== 'resolved').length} Active Inquiries
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Resolve customer inquiries regarding licensing keys, bulk render errors, workstation activation limits, and billing questions.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
        <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
        {(['all', 'open', 'in_progress', 'resolved'] as const).map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
              statusFilter === st
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Grid: Ticket List + Thread Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-2 space-y-3 max-h-[640px] overflow-y-auto custom-scrollbar pr-1">
          {filteredTickets.map(ticket => {
            const isSelected = selectedTicket?.id === ticket.id;
            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">
                    {ticket.ticketNumber}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                      ticket.priority === 'urgent'
                        ? 'bg-red-500/20 text-red-300'
                        : ticket.priority === 'high'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {ticket.priority}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white line-clamp-1">{ticket.subject}</h4>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{ticket.customerName}</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {ticket.messages.length} msg(s)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Ticket Thread & Reply Panel */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[640px]">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {selectedTicket.subject}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Client: <strong className="text-slate-200">{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={e => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_on_customer">Waiting on Client</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Messages Discussion Scroll */}
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3 bg-slate-950/40">
                {selectedTicket.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-xl text-xs space-y-1.5 max-w-[85%] ${
                      msg.isAdminReply
                        ? 'ml-auto bg-indigo-950/80 border border-indigo-700/60 text-indigo-100'
                        : 'mr-auto bg-slate-900 border border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 font-mono">
                      <span className="font-bold text-white flex items-center gap-1">
                        {msg.isAdminReply ? <ShieldCheck className="w-3 h-3 text-indigo-400" /> : <User className="w-3 h-3 text-slate-400" />}
                        {msg.senderName} ({msg.senderRole})
                      </span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Type official Master Owner reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Reply'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40 text-indigo-400" />
              <span>Select a support ticket from the list to view dialogue history and reply.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
