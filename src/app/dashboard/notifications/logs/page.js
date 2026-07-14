'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../lib/api-client';
import {
  FileText,
  Search,
  RefreshCw,
  AlertCircle,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Activity,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function NotificationLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/admin/notifications/logs');
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter(log => {
    return !search ||
      log.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      log.recipient?.toLowerCase().includes(search.toLowerCase()) ||
      log.channel?.toLowerCase().includes(search.toLowerCase()) ||
      log.status?.toLowerCase().includes(search.toLowerCase()) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-purple-400" />
            Notification Logs
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Audit trail of customer emails and SMS dispatches</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filter/Search */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search logs by order #, recipient, channel, status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-4 border-t-purple-500 border-zinc-800 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Activity className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">No notification logs found</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-900/50">
                  <th className="py-4 px-6">Sent At</th>
                  <th className="py-4 px-6">Order #</th>
                  <th className="py-4 px-6">Recipient</th>
                  <th className="py-4 px-6">Channel</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-850/40 transition-colors">
                    <td className="py-4 px-6 text-zinc-500 text-xs">
                      {new Date(log.sentAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">{log.orderNumber}</td>
                    <td className="py-4 px-6 text-zinc-300 font-mono text-xs">{log.recipient}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 border border-zinc-700/80 px-2 py-0.5 rounded">
                        {log.channel === 'EMAIL' ? <Mail className="w-3.5 h-3.5 text-blue-400" /> : <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />}
                        {log.channel}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                        log.status === 'SENT' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {log.status === 'SENT' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs text-zinc-550 max-w-xs truncate">
                      {log.errorMessage || 'Dispatched successfully'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
