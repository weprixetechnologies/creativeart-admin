'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../lib/api-client';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Coins,
  ArrowRight,
  TrendingUp,
  Clock,
  Settings,
  X,
  Check
} from 'lucide-react';

export default function AffiliatesAdminPage() {
  const [affiliates, setAffiliates] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Action States
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Form states
  const [overrideCode, setOverrideCode] = useState('');
  const [commType, setCommType] = useState('PERCENTAGE');
  const [commValue, setCommValue] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const fetchKPIs = useCallback(async () => {
    try {
      const data = await apiClient.get('/admin/affiliate-dashboard');
      setKpis(data);
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    }
  }, []);

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await apiClient.get('/admin/affiliates', params);
      setAffiliates(data);
    } catch (err) {
      console.error('Failed to load affiliates:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchKPIs();
    fetchAffiliates();
  }, [fetchKPIs, fetchAffiliates]);

  const handleApprove = async () => {
    try {
      await apiClient.post(`/admin/affiliates/${selectedAffiliate.id}/approve`, {
        referralCode: overrideCode || undefined,
        commissionType: commType,
        commissionValue: commValue ? parseFloat(commValue) : null
      });
      setShowApproveModal(false);
      setSelectedAffiliate(null);
      fetchAffiliates();
      fetchKPIs();
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async () => {
    try {
      await apiClient.post(`/admin/affiliates/${selectedAffiliate.id}/reject`, {
        reason: rejectReason
      });
      setShowRejectModal(false);
      setSelectedAffiliate(null);
      setRejectReason('');
      fetchAffiliates();
      fetchKPIs();
    } catch (err) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleOverride = async () => {
    try {
      await apiClient.put(`/admin/affiliates/${selectedAffiliate.id}/commission`, {
        commissionType: commType || null,
        commissionValue: commValue ? parseFloat(commValue) : null
      });
      setShowOverrideModal(false);
      setSelectedAffiliate(null);
      fetchAffiliates();
    } catch (err) {
      alert(err.message || 'Failed to save commission override');
    }
  };

  const handleSuspend = async (id) => {
    const reason = prompt('Please enter a suspension reason:');
    if (!reason) return;
    try {
      await apiClient.post(`/admin/affiliates/${id}/suspend`, { reason });
      fetchAffiliates();
      fetchKPIs();
    } catch (err) {
      alert(err.message || 'Suspension failed');
    }
  };

  const filtered = affiliates.filter(a => {
    const matchSearch =
      a.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.referralCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="w-7 h-7 text-teal-400" />
          Affiliate Network
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Manage applications, configure commission overrides, and monitor network health.</p>
      </div>

      {/* KPI Section */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Pending Applications</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-white">{kpis.pendingApplications}</span>
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Affiliates</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-white">{kpis.activeAffiliates}</span>
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Pending Liability</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-white">₹{kpis.pendingLiability.toLocaleString('en-IN')}</span>
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Attributed Revenue (MTD)</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-white">₹{kpis.attributedRevenueThisMonth.toLocaleString('en-IN')}</span>
              <TrendingUp className="w-6 h-6 text-teal-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
          <input
            type="text"
            placeholder="Search affiliates by name, email, or code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-850 border border-zinc-750 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-zinc-850 border border-zinc-750 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* List Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-t-teal-500 border-zinc-800 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-16 text-center text-zinc-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No affiliate applications found.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-950/20">
                  <th className="py-4 px-6">Affiliate User</th>
                  <th className="py-4 px-6">Referral Code</th>
                  <th className="py-4 px-6">Commission Override</th>
                  <th className="py-4 px-6">Applied At</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-850/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{item.userName}</div>
                      <div className="text-xs text-zinc-500">{item.userEmail}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-teal-400">{item.referralCode}</td>
                    <td className="py-4 px-6">
                      {item.commissionType ? (
                        <span className="text-xs bg-zinc-800 border border-zinc-700/80 px-2.5 py-0.5 rounded text-teal-300 font-semibold">
                          {item.commissionType === 'PERCENTAGE' ? `${item.commissionValue}%` : `₹${item.commissionValue}`}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 italic">Global Default</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-zinc-500">
                      {new Date(item.appliedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        item.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        item.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-rose-500/10 border-rose-500/20 text-rose-450'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {item.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedAffiliate(item);
                              setOverrideCode(item.referralCode);
                              setShowApproveModal(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAffiliate(item);
                              setShowRejectModal(true);
                            }}
                            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {item.status === 'APPROVED' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedAffiliate(item);
                              setCommType(item.commissionType || 'PERCENTAGE');
                              setCommValue(item.commissionValue || '');
                              setShowOverrideModal(true);
                            }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Override
                          </button>
                          <button
                            onClick={() => handleSuspend(item.id)}
                            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Suspend
                          </button>
                        </>
                      )}
                      {item.status === 'SUSPENDED' && (
                        <button
                          onClick={() => {
                            setSelectedAffiliate(item);
                            setOverrideCode(item.referralCode);
                            setShowApproveModal(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Re-Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Approve Affiliate Application</h3>
              <button onClick={() => setShowApproveModal(false)} className="text-zinc-550 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Referral Code Override</label>
                <input
                  type="text"
                  value={overrideCode}
                  onChange={e => setOverrideCode(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Commission Type Override</label>
                <select
                  value={commType}
                  onChange={e => setCommType(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Commission Value Override (Optional)</label>
                <input
                  type="number"
                  placeholder="Leave blank for global default"
                  value={commValue}
                  onChange={e => setCommValue(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>
            <button
              onClick={handleApprove}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Approve Now
            </button>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white text-rose-450">Reject Application</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-zinc-550 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Required. Provide specific details to the customer..."
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-650"
                required
              />
            </div>
            <button
              onClick={handleReject}
              className="w-full py-3 bg-rose-650 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}

      {/* COMMISSION OVERRIDE MODAL */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Edit Commission Overrides</h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-zinc-550 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Commission Type Override</label>
                <select
                  value={commType}
                  onChange={e => setCommType(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Commission Value Override (Optional)</label>
                <input
                  type="number"
                  placeholder="Leave blank for global default"
                  value={commValue}
                  onChange={e => setCommValue(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>
            <button
              onClick={handleOverride}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Save Overrides
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
