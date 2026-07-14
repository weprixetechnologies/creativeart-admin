'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../lib/api-client';
import {
  Kanban,
  RefreshCw,
  AlertCircle,
  Play,
  CheckCircle,
  FileText,
  User,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const COLUMNS = [
  { id: 'MATERIAL_RECEIVED',  label: 'Awaiting Production', color: 'border-blue-500/30 text-blue-400 bg-blue-500/5' },
  { id: 'IN_PRODUCTION',      label: 'In Production',       color: 'border-amber-500/30 text-amber-400 bg-amber-500/5' },
  { id: 'READY_PENDING_FINAL_PAYMENT', label: 'Finished (Awaiting Final Payment)', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' }
];

export default function ProductionBoardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mark Ready Modal State
  const [readyOpen, setReadyOpen] = useState(false);
  const [readyOrder, setReadyOrder] = useState(null);
  const [finalAmount, setFinalAmount] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [readyLoading, setReadyLoading] = useState(false);
  const [readyError, setReadyError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allOrders = await apiClient.get('/admin/orders');
      // Filter for custom project orders that are in production phases
      const productionOrders = allOrders.filter(o =>
        o.orderType === 'DUAL_PAYMENT' &&
        ['MATERIAL_RECEIVED', 'IN_PRODUCTION', 'READY_PENDING_FINAL_PAYMENT'].includes(o.status)
      );
      setOrders(productionOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const startProd = async (orderId) => {
    try {
      await apiClient.post(`/admin/orders/${orderId}/start-production`);
      await fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const openMarkReady = (order) => {
    setReadyOrder(order);
    setFinalAmount(order.finalAmount || '');
    setOverrideReason('');
    setReadyOpen(true);
  };

  const handleMarkReadySubmit = async () => {
    if (!readyOrder) return;
    setReadyLoading(true);
    setReadyError(null);
    try {
      const payload = {};
      if (finalAmount !== '' && parseFloat(finalAmount) !== parseFloat(readyOrder.finalAmount)) {
        payload.finalAmount = parseFloat(finalAmount);
        if (!overrideReason.trim()) {
          setReadyError('A reason is required to override the final payment amount.');
          setReadyLoading(false);
          return;
        }
        payload.overrideReason = overrideReason.trim();
      }

      await apiClient.post(`/admin/orders/${readyOrder.id}/mark-ready`, payload);
      setReadyOpen(false);
      setReadyOrder(null);
      setFinalAmount('');
      setOverrideReason('');
      await fetchOrders();
    } catch (err) {
      setReadyError(err.message);
    } finally {
      setReadyLoading(false);
    }
  };

  // Group orders by column
  const colsData = COLUMNS.reduce((acc, col) => {
    acc[col.id] = orders.filter(o => o.status === col.id);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Kanban className="w-7 h-7 text-purple-400" />
            Production Board
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Track custom projects from materials received to production and final invoicing</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-4 border-t-purple-500 border-zinc-800 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {COLUMNS.map(col => {
            const colOrders = colsData[col.id] || [];
            return (
              <div key={col.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col min-h-[500px]">
                <div className={`flex items-center justify-between border-b border-zinc-850 pb-3 mb-4`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      col.id === 'MATERIAL_RECEIVED' ? 'bg-blue-400' : col.id === 'IN_PRODUCTION' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`} />
                    <h2 className="text-sm font-bold text-white">{col.label}</h2>
                  </div>
                  <span className="text-xs bg-zinc-850 px-2 py-0.5 rounded-full text-zinc-500 font-semibold">
                    {colOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {colOrders.map(order => (
                    <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors group">
                      <div className="flex justify-between items-start">
                        <Link href={`/dashboard/orders/${order.id}`} className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                          {order.orderNumber}
                        </Link>
                      </div>

                      <div className="space-y-1.5 text-xs text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-650" />
                          <span className="truncate">{order.customerName}</span>
                        </div>
                      </div>

                      {/* Action buttons based on current state */}
                      {order.status === 'MATERIAL_RECEIVED' && (
                        <button
                          onClick={() => startProd(order.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-purple-600/10 hover:bg-purple-600 border border-purple-500/20 hover:border-transparent text-purple-400 hover:text-white rounded-xl text-xs font-semibold transition-all mt-1"
                        >
                          <Play className="w-3.5 h-3.5" /> Start Production
                        </button>
                      )}

                      {order.status === 'IN_PRODUCTION' && (
                        <button
                          onClick={() => openMarkReady(order)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-transparent text-emerald-400 hover:text-white rounded-xl text-xs font-semibold transition-all mt-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Finished
                        </button>
                      )}

                      {order.status === 'READY_PENDING_FINAL_PAYMENT' && (
                        <div className="text-[10px] text-center text-zinc-500 font-semibold bg-zinc-850 py-1.5 rounded-lg border border-zinc-800">
                          Awaiting Balance Payment
                        </div>
                      )}
                    </div>
                  ))}

                  {colOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-600 border border-dashed border-zinc-850 rounded-xl">
                      <p className="text-xs">No orders in this stage</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mark Finished & Final Invoice Pricing Modal */}
      {readyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Invoice & Mark Finished</h3>
            <p className="text-sm text-zinc-400">
              Complete production on order <span className="text-purple-400 font-semibold">{readyOrder?.orderNumber}</span>. Set final payment amount.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Final Payment Amount (₹)
                </label>
                <input
                  type="number"
                  value={finalAmount}
                  onChange={e => setFinalAmount(e.target.value)}
                  placeholder="Final Amount"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Default: ₹{parseFloat(readyOrder?.finalAmount || 0).toLocaleString('en-IN')}. Edit only if overriding.
                </p>
              </div>

              {/* Only show override reason if amount changes */}
              {finalAmount !== '' && parseFloat(finalAmount) !== parseFloat(readyOrder?.finalAmount) && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Override Reason *
                  </label>
                  <textarea
                    rows={2}
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    placeholder="Provide reason for updating the pricing..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              )}
            </div>

            {readyError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{readyError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setReadyOpen(false); setReadyError(null); setFinalAmount(''); setOverrideReason(''); }}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkReadySubmit}
                disabled={readyLoading}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {readyLoading ? 'Processing...' : 'Mark Finished'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
