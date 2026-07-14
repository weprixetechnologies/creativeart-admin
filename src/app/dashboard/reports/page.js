'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../lib/api-client';
import {
  FileText,
  Search,
  RefreshCw,
  AlertCircle,
  Download,
  Calendar,
  User,
  Shield,
  Activity
} from 'lucide-react';

export default function ReportsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/admin/dashboard/audit-logs');
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
      log.actorName?.toLowerCase().includes(search.toLowerCase()) ||
      log.fromStatus?.toLowerCase().includes(search.toLowerCase()) ||
      log.toStatus?.toLowerCase().includes(search.toLowerCase()) ||
      log.note?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-purple-400" />
            Audit Logs & Reports
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Audit state transitions, view staff override logs, and export reports</p>
        </div>
        <div className="flex gap-2.5">
          <a
            href="/api/v1/admin/dashboard/audit-logs/export"
            download
            className="flex items-center gap-2 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter/Search */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search logs by order #, actor name, status, or notes..."
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
          <FileText className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">No audit logs found</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-900/50">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Order #</th>
                  <th className="py-4 px-6">Transition</th>
                  <th className="py-4 px-6">Actor</th>
                  <th className="py-4 px-6">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-zinc-850/40 transition-colors">
                    <td className="py-4 px-6 text-zinc-500 text-xs">
                      {new Date(log.changedAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">{log.orderNumber}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-zinc-500 font-semibold">{log.fromStatus}</span>
                        <span className="text-zinc-600">➔</span>
                        <span className="text-purple-400 font-semibold">{log.toStatus}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="font-medium text-zinc-300">{log.actorName}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">{log.actorType}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-zinc-400 text-xs max-w-xs truncate" title={log.note}>
                      {log.note || '—'}
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
