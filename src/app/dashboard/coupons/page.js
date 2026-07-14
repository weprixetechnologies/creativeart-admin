'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../lib/api-client';
import {
  Tag,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  TrendingDown
} from 'lucide-react';

function StatusPill({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
      status === 'ACTIVE'
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
        : 'bg-zinc-700 text-zinc-400 border-zinc-600'
    }`}>{status}</span>
  );
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [expandedData, setExpandedData] = useState({});

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: '', type: 'FLAT', value: '', minOrderValue: '',
    usageLimitGlobal: '', usageLimitPerUser: '', expiresAt: ''
  });
  const [createError, setCreateError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiClient.get('/admin/coupons');
      setCoupons(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const toggleExpand = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!expandedData[id]) {
      try {
        const data = await apiClient.get(`/admin/coupons/${id}`);
        setExpandedData(prev => ({ ...prev, [id]: data }));
      } catch {}
    }
  };

  const toggleStatus = async (coupon) => {
    const newStatus = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiClient.patch(`/admin/coupons/${coupon.id}`, { status: newStatus });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: newStatus } : c));
    } catch (err) { alert(err.message); }
  };

  const deleteCoupon = async (coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/admin/coupons/${coupon.id}`);
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      if (expanded === coupon.id) setExpanded(null);
    } catch (err) { alert(err.message); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true); setCreateError(null);
    try {
      await apiClient.post('/admin/coupons', {
        code: form.code,
        type: form.type,
        value: parseFloat(form.value),
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : null,
        usageLimitGlobal: form.usageLimitGlobal ? parseInt(form.usageLimitGlobal) : null,
        usageLimitPerUser: form.usageLimitPerUser ? parseInt(form.usageLimitPerUser) : null,
        expiresAt: form.expiresAt || null
      });
      setShowCreate(false);
      setForm({ code: '', type: 'FLAT', value: '', minOrderValue: '', usageLimitGlobal: '', usageLimitPerUser: '', expiresAt: '' });
      await fetchCoupons();
    } catch (err) { setCreateError(err.message); }
    finally { setCreateLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Tag className="w-7 h-7 text-purple-400" /> Coupons
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Manage discount codes and view usage reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCoupons} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(s => !s)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> New Coupon
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">Create New Coupon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Code *', key: 'code', placeholder: 'e.g. SUMMER20', upper: true },
              { label: 'Min Order Value (₹)', key: 'minOrderValue', placeholder: 'e.g. 500', type: 'number' },
              { label: 'Global Usage Limit', key: 'usageLimitGlobal', placeholder: 'Leave blank = unlimited', type: 'number' },
              { label: 'Per User Limit', key: 'usageLimitPerUser', placeholder: 'Leave blank = unlimited', type: 'number' },
              { label: 'Expires At', key: 'expiresAt', type: 'datetime-local' },
            ].map(({ label, key, placeholder, type = 'text', upper }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: upper ? e.target.value.toUpperCase() : e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">Type *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
                Value * {form.type === 'PERCENTAGE' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder={form.type === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 200'}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          {createError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{createError}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={createLoading} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
              {createLoading ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      )}

      {/* Coupons List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-t-purple-500 border-zinc-800 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
            <p className="text-sm text-zinc-400">{error}</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Tag className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">No coupons yet. Create one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {coupons.map(coupon => (
              <div key={coupon.id}>
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-white font-mono text-sm">{coupon.code}</span>
                      <StatusPill status={coupon.status} />
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold">
                        {coupon.type === 'FLAT' ? `₹${coupon.value}` : `${coupon.value}%`} off
                      </span>
                      {coupon.minOrderValue && (
                        <span className="text-xs text-zinc-500">min ₹{coupon.minOrderValue}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {coupon.usageCount} uses</span>
                      {coupon.expiresAt && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                          Expires {new Date(coupon.expiresAt).toLocaleDateString('en-IN')}
                        </span>
                      )}
                      {coupon.usageLimitGlobal && (
                        <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" />
                          {coupon.usageCount}/{coupon.usageLimitGlobal} used
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleStatus(coupon)} title={coupon.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} className="text-zinc-500 hover:text-purple-400 transition-colors p-1">
                      {coupon.status === 'ACTIVE' ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => deleteCoupon(coupon)} className="text-zinc-600 hover:text-rose-400 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleExpand(coupon.id)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                      {expanded === coupon.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {/* Expanded usage report */}
                {expanded === coupon.id && expandedData[coupon.id] && (
                  <div className="px-6 pb-5 pt-1 bg-zinc-950/40">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Recent Usages</p>
                    {expandedData[coupon.id].usages.length === 0 ? (
                      <p className="text-xs text-zinc-600">No usages recorded yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {expandedData[coupon.id].usages.map(u => (
                          <div key={u.id} className="flex items-center gap-4 text-xs text-zinc-400 bg-zinc-900 rounded-lg px-3 py-2">
                            <span className="font-medium text-zinc-300">{u.userName}</span>
                            <span className="text-zinc-600">{u.userEmail}</span>
                            {u.orderNumber && <span className="ml-auto font-mono text-purple-400">{u.orderNumber}</span>}
                            <span className="text-zinc-600">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
