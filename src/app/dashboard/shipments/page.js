'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../lib/api-client';
import {
  Truck,
  Search,
  RefreshCw,
  AlertCircle,
  Download,
  Calendar,
  User,
  ExternalLink,
  Package
} from 'lucide-react';

export default function ShipmentsDashboardPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/admin/orders/shipments');
      setShipments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const filtered = shipments.filter(ship => {
    return !search ||
      ship.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      ship.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      ship.awbCode?.toLowerCase().includes(search.toLowerCase()) ||
      ship.courierName?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Truck className="w-7 h-7 text-purple-400" />
            Shipments Board
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Manage outbound customer shipments and download carrier labels</p>
        </div>
        <button
          onClick={fetchShipments}
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
            placeholder="Search by order #, AWB, customer, or carrier..."
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
          <Truck className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">No shipments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(ship => (
            <div key={ship.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{ship.orderNumber}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                    <User className="w-3.5 h-3.5" />
                    <span>{ship.customerName}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                  ship.status === 'delivered'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                    : ship.status === 'shipped'
                    ? 'bg-violet-500/15 text-violet-400 border-violet-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {ship.status}
                </span>
              </div>

              <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Carrier</span>
                  <span className="font-semibold text-zinc-200">{ship.courierName || '—'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>AWB Code</span>
                  <span className="font-mono text-purple-400 font-semibold">{ship.awbCode || '—'}</span>
                </div>
                <div className="flex justify-between text-zinc-400 border-t border-zinc-800/80 pt-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Packed At</span>
                  <span className="text-zinc-300">
                    {ship.packedAt ? new Date(ship.packedAt).toLocaleString('en-IN') : '—'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                {ship.labelUrl && (
                  <a
                    href={ship.labelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Label
                  </a>
                )}
                {ship.manifestUrl && (
                  <a
                    href={ship.manifestUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Manifest
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
