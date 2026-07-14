'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../lib/api-client';
import {
  Inbox,
  Search,
  RefreshCw,
  AlertCircle,
  Truck,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  Package
} from 'lucide-react';
import Link from 'next/link';

export default function MaterialsInboxPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Confirm Received Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [conditionNotes, setConditionNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/admin/orders/materials-inbox');
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleConfirmSubmit = async () => {
    if (!confirmOrder) return;
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      await apiClient.post(`/admin/orders/${confirmOrder.id}/confirm-material-received`, {
        conditionNotes: conditionNotes.trim(),
        conditionPhotoUrl: photoUrl.trim() || null
      });
      setConfirmOpen(false);
      setConfirmOrder(null);
      setConditionNotes('');
      setPhotoUrl('');
      await fetchMaterials();
    } catch (err) {
      setConfirmError(err.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const filtered = orders.filter(order => {
    const matchSearch = !search ||
      order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      order.trackingNumber?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Inbox className="w-7 h-7 text-purple-400" />
            Materials Inbox
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Receive and inspect raw materials shipped by customers</p>
        </div>
        <button
          onClick={fetchMaterials}
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
            placeholder="Search by order number, customer name, or tracking number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid List */}
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
          <Inbox className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">No incoming materials in transit</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{order.orderNumber}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                    <User className="w-3.5 h-3.5" />
                    <span>{order.customerName} ({order.customerEmail})</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  In Transit
                </span>
              </div>

              {/* Courier/Shipping Info */}
              <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Courier</span>
                  <span className="font-semibold text-zinc-200">{order.courierName}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Tracking #</span>
                  <span className="font-mono text-purple-400 font-semibold">{order.trackingNumber}</span>
                </div>
                <div className="flex justify-between text-zinc-400 border-t border-zinc-800/80 pt-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Shipped At</span>
                  <span className="text-zinc-300">
                    {order.shippedAt ? new Date(order.shippedAt).toLocaleString('en-IN') : '—'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Package className="w-3.5 h-3.5" /> View Order
                </Link>
                <button
                  onClick={() => { setConfirmOrder(order); setConfirmOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Received
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Received Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Confirm Material Intake</h3>
            <p className="text-sm text-zinc-400">
              Inspect incoming custom materials for order <span className="text-purple-400 font-semibold">{confirmOrder?.orderNumber}</span>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Condition Notes</label>
                <textarea
                  rows={3}
                  value={conditionNotes}
                  onChange={e => setConditionNotes(e.target.value)}
                  placeholder="Describe material condition, quantity, flaws, or approval notes..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Condition Photo URL (Optional)</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="https://cdn.example.com/photo.jpg"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {confirmError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{confirmError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setConfirmOpen(false); setConfirmError(null); setConditionNotes(''); setPhotoUrl(''); }}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={confirmLoading}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {confirmLoading ? 'Confirming...' : 'Mark Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
