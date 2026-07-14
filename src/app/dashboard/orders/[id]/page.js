'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../../lib/api-client';
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Clock,
  FileText,
  TriangleAlert,
  CheckCircle2,
  ChevronDown,
  Download,
  RefreshCw
} from 'lucide-react';

const STATUS_META = {
  PLACED:                     { label: 'Placed',                  color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  PAID:                       { label: 'Paid',                    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  PACKED:                     { label: 'Packed',                  color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  SHIPPED:                    { label: 'Shipped',                 color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  DELIVERED:                  { label: 'Delivered',               color: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
  CANCELLED:                  { label: 'Cancelled',               color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  REFUNDED:                   { label: 'Refunded',                color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  RTO:                        { label: 'RTO',                     color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  EXCEPTION:                  { label: 'Exception',               color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  BOOKED_PENDING_ADVANCE:     { label: 'Pending Advance',         color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  ADVANCE_PAID:               { label: 'Advance Paid',            color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  AWAITING_MATERIAL_DISPATCH: { label: 'Awaiting Material',       color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  MATERIAL_IN_TRANSIT:        { label: 'Material In Transit',     color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  MATERIAL_RECEIVED:          { label: 'Material Received',       color: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
  IN_PRODUCTION:              { label: 'In Production',           color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
  READY_PENDING_FINAL_PAYMENT:{ label: 'Ready – Final Payment',   color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  FINAL_PAID:                 { label: 'Final Paid',              color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  ON_HOLD:                    { label: 'On Hold',                 color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
};

// Legal transitions for admin to trigger manually
const ADMIN_TRANSITIONS = {
  STANDARD: {
    PLACED:   ['CANCELLED'],
    PAID:     ['PACKED', 'REFUNDED'],
    PACKED:   ['SHIPPED'],
    SHIPPED:  ['DELIVERED', 'RTO', 'EXCEPTION'],
  },
  DUAL_PAYMENT: {
    AWAITING_MATERIAL_DISPATCH: ['ON_HOLD', 'CANCELLED'],
    MATERIAL_IN_TRANSIT:        ['MATERIAL_RECEIVED', 'ON_HOLD', 'CANCELLED'],
    MATERIAL_RECEIVED:          ['IN_PRODUCTION', 'ON_HOLD', 'CANCELLED'],
    IN_PRODUCTION:              ['READY_PENDING_FINAL_PAYMENT', 'ON_HOLD', 'CANCELLED'],
    READY_PENDING_FINAL_PAYMENT:['ON_HOLD', 'CANCELLED'],
    FINAL_PAID:                 ['PACKED', 'ON_HOLD', 'CANCELLED'],
    PACKED:                     ['SHIPPED', 'ON_HOLD', 'CANCELLED'],
    SHIPPED:                    ['DELIVERED', 'RTO', 'EXCEPTION'],
    ON_HOLD:                    ['CANCELLED'],
  }
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: 'bg-zinc-700 text-zinc-400 border-zinc-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function getPaymentStatusDisplay(status) {
  if (status === 'CAPTURED') return { label: 'SUCCESSFUL', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
  if (status === 'FAILED') return { label: 'FAILED', color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' };
  if (status === 'CREATED' || status === 'PENDING') return { label: 'PENDING', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' };
  return { label: status, color: 'bg-zinc-700 text-zinc-400 border-zinc-600' };
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
        <Icon className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Override modal state
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState(null);

  // Mark Packed state
  const [packLoading, setPackLoading] = useState(false);
  const [paymentCheckLoading, setPaymentCheckLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/admin/orders/${orderId}`);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const availableTransitions = order
    ? (ADMIN_TRANSITIONS[order.orderType]?.[order.status] || [])
    : [];

  const handleMarkPacked = async () => {
    if (!confirm('Mark this order as packed and push to Shiprocket?')) return;
    setPackLoading(true);
    try {
      await apiClient.post(`/admin/orders/${orderId}/mark-packed`);
      await fetchOrder();
    } catch (err) {
      alert(err.message);
    } finally {
      setPackLoading(false);
    }
  };

  const handleForcePaymentCheck = async () => {
    if (!confirm('Force check PhonePe payment status?')) return;
    setPaymentCheckLoading(true);
    try {
      const res = await apiClient.post(`/admin/orders/${orderId}/force-payment-status`);
      alert(`Payment Check Complete. Current Payment Status: ${res.paymentStatus} / Order Status: ${res.orderStatus}`);
      await fetchOrder();
    } catch (err) {
      alert(err.message);
    } finally {
      setPaymentCheckLoading(false);
    }
  };

  const handleOverrideSubmit = async () => {
    if (!overrideStatus) return;
    if (!overrideNote.trim()) {
      setOverrideError('A descriptive note is required for manual status overrides.');
      return;
    }
    setOverrideLoading(true);
    setOverrideError(null);
    try {
      await apiClient.post(`/admin/orders/${orderId}/status`, {
        toStatus: overrideStatus,
        note: overrideNote.trim()
      });
      setOverrideOpen(false);
      setOverrideStatus('');
      setOverrideNote('');
      await fetchOrder();
    } catch (err) {
      setOverrideError(err.message);
    } finally {
      setOverrideLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-purple-500 border-zinc-800 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
        <TriangleAlert className="w-10 h-10 text-rose-400" />
        <p className="text-zinc-400 text-sm">{error}</p>
        <button onClick={fetchOrder} className="text-purple-400 text-sm hover:text-purple-300">Retry</button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{order.orderNumber}</h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={order.status} />
              <span className="text-xs text-zinc-500">
                {order.orderType === 'DUAL_PAYMENT' ? 'Custom Project' : 'Standard Order'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(order.status === 'PAID' || order.status === 'FINAL_PAID') && (
            <button
              onClick={handleMarkPacked}
              disabled={packLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              {packLoading ? 'Processing...' : 'Mark Packed & Ship'}
            </button>
          )}
          {/* Force Check Payment Button */}
          <button
            onClick={handleForcePaymentCheck}
            disabled={paymentCheckLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            {paymentCheckLoading ? 'Checking...' : 'Force Check Payment'}
          </button>
          {availableTransitions.length > 0 && (
            <button
              onClick={() => { setOverrideOpen(true); setOverrideStatus(availableTransitions[0]); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Update Status <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
          <a
            href={`/api/v1/orders/${orderId}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Invoice
          </a>
          <button
            onClick={fetchOrder}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Subtotal',   val: order.subtotal },
          { label: 'Discount',   val: order.discountAmount },
          { label: 'Tax',        val: order.taxAmount },
          { label: 'Total',      val: order.totalAmount, highlight: true },
        ].map(({ label, val, highlight }) => (
          <div key={label} className={`bg-zinc-900 border rounded-2xl p-4 ${highlight ? 'border-purple-500/30' : 'border-zinc-800'}`}>
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-lg font-bold ${highlight ? 'text-purple-300' : 'text-white'}`}>
              ₹{parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Order Items */}
      <Section title="Order Items" icon={Package}>
        <div className="space-y-3">
          {order.items?.map(item => (
            <div key={item.id} className="flex items-start justify-between gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/products/${item.productId}`}
                  className="font-semibold text-white hover:text-purple-300 transition-colors text-sm"
                >
                  {item.productNameSnapshot}
                </Link>
                {item.variantSku && (
                  <p className="text-xs text-zinc-500 mt-0.5">SKU: {item.variantSku}</p>
                )}
                {Object.keys(item.customFieldValues || {}).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Object.values(item.customFieldValues).map((cf, idx) => (
                      <p key={idx} className="text-xs text-zinc-400">
                        <span className="text-zinc-500">{cf.label}:</span> {cf.value}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-white">
                  ₹{parseFloat(item.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {item.qty} × ₹{parseFloat(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Payments */}
      <Section title="Payment Records" icon={CreditCard}>
        <div className="space-y-3">
          {order.payments?.length === 0 ? (
            <p className="text-sm text-zinc-500">No payment records yet.</p>
          ) : order.payments?.map(pay => {
            const pStatus = getPaymentStatusDisplay(pay.status);
            return (
            <div key={pay.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">{pay.paymentType} payment</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${pStatus.color}`}>
                    {pStatus.label}
                  </span>
                </div>
                {pay.gatewayPaymentId && (
                  <p className="text-xs text-zinc-600 mt-0.5 font-mono">{pay.gatewayPaymentId}</p>
                )}
              </div>
              <p className="text-sm font-bold text-white">
                ₹{parseFloat(pay.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            );
          })}
        </div>
      </Section>

      {/* Status History Timeline */}
      <Section title="Status History" icon={Clock}>
        <div className="space-y-3">
          {order.statusHistory?.map((hist, idx) => (
            <div key={hist.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 ${idx === 0 ? 'bg-purple-500' : 'bg-zinc-600'}`} />
                {idx < order.statusHistory.length - 1 && (
                  <div className="w-px flex-1 bg-zinc-800 mt-1" />
                )}
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={hist.toStatus} />
                  {hist.fromStatus && (
                    <span className="text-xs text-zinc-600">from {STATUS_META[hist.fromStatus]?.label || hist.fromStatus}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <span className="font-medium uppercase">{hist.actorType}</span>
                  {hist.createdAt && (
                    <span>· {new Date(hist.createdAt).toLocaleString('en-IN')}</span>
                  )}
                </div>
                {hist.note && (
                  <p className="text-xs text-zinc-400 mt-1 italic">"{hist.note}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Manual Override Modal */}
      {overrideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Override Order Status</h3>
            <p className="text-sm text-zinc-400">
              Manually update order <span className="text-purple-400 font-medium">{order.orderNumber}</span> status.
              A note is required.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">New Status</label>
              <select
                value={overrideStatus}
                onChange={e => setOverrideStatus(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {availableTransitions.map(s => (
                  <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                ))}
              </select>

              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-4">Reason / Note *</label>
              <textarea
                rows={3}
                value={overrideNote}
                onChange={e => setOverrideNote(e.target.value)}
                placeholder="Describe why you are changing the status..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {overrideError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{overrideError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setOverrideOpen(false); setOverrideError(null); setOverrideNote(''); }}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={overrideLoading}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {overrideLoading ? 'Updating...' : 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
