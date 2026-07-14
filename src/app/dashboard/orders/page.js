'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '../../../lib/api-client';
import {
  ShoppingBag,
  Search,
  Filter,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  CreditCard,
  AlertCircle
} from 'lucide-react';

const STATUS_META = {
  PLACED:                    { label: 'Placed',                   color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  PAID:                      { label: 'Paid',                     color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  PACKED:                    { label: 'Packed',                   color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  SHIPPED:                   { label: 'Shipped',                  color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  DELIVERED:                 { label: 'Delivered',                color: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
  CANCELLED:                 { label: 'Cancelled',                color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  REFUNDED:                  { label: 'Refunded',                 color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  RTO:                       { label: 'RTO',                      color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  EXCEPTION:                 { label: 'Exception',                color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  BOOKED_PENDING_ADVANCE:    { label: 'Pending Advance',          color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  ADVANCE_PAID:              { label: 'Advance Paid',             color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  AWAITING_MATERIAL_DISPATCH:{ label: 'Awaiting Material',        color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  MATERIAL_IN_TRANSIT:       { label: 'Material In Transit',      color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  MATERIAL_RECEIVED:         { label: 'Material Received',        color: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
  IN_PRODUCTION:             { label: 'In Production',            color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  READY_PENDING_FINAL_PAYMENT:{ label: 'Ready – Final Payment',   color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  FINAL_PAID:                { label: 'Final Paid',               color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  ON_HOLD:                   { label: 'On Hold',                  color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: 'bg-zinc-700 text-zinc-400 border-zinc-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.color}`}>
      {meta.label}
    </span>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/admin/orders');
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter(order => {
    const matchSearch = !search ||
      order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      String(order.id).includes(search);
    const matchType = filterType === 'ALL' || order.orderType === filterType;
    const matchStatus = filterStatus === 'ALL' || order.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: orders.length,
    standard: orders.filter(o => o.orderType === 'STANDARD').length,
    dualPayment: orders.filter(o => o.orderType === 'DUAL_PAYMENT').length,
    pending: orders.filter(o => ['PLACED', 'BOOKED_PENDING_ADVANCE'].includes(o.status)).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-purple-400" />
            Orders
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Manage all standard and custom project orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'text-purple-400' },
          { label: 'Standard', value: stats.standard, icon: CreditCard, color: 'text-blue-400' },
          { label: 'Custom Projects', value: stats.dualPayment, icon: Package, color: 'text-indigo-400' },
          { label: 'Pending Action', value: stats.pending, icon: Clock, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 font-medium">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by order number or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
        >
          <option value="ALL">All Types</option>
          <option value="STANDARD">Standard</option>
          <option value="DUAL_PAYMENT">Custom Project</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          {Object.entries(STATUS_META).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-t-purple-500 border-zinc-800 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
            <p className="text-sm text-zinc-400">{error}</p>
            <button onClick={fetchOrders} className="mt-4 text-xs text-purple-400 hover:text-purple-300">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <ShoppingBag className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-semibold">Order</th>
                  <th className="px-6 py-4 text-left font-semibold">Type</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Total</th>
                  <th className="px-6 py-4 text-left font-semibold">Date</th>
                  <th className="px-6 py-4 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{order.orderNumber}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">ID #{order.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        order.orderType === 'DUAL_PAYMENT'
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {order.orderType === 'DUAL_PAYMENT' ? 'Custom Project' : 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-white">
                      ₹{parseFloat(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 group-hover:text-purple-400 transition-colors font-medium"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
