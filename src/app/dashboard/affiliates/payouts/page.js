'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../lib/api-client';
import {
  Coins,
  Layers,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  User,
  Plus,
  ArrowDownToLine
} from 'lucide-react';

export default function AffiliatePayoutsAdminPage() {
  const [affiliates, setAffiliates] = useState([]);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState('');
  const [commissions, setCommissions] = useState([]);
  const [selectedCommissionIds, setSelectedCommissionIds] = useState([]);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutBatches, setPayoutBatches] = useState([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Load payout-approved affiliates
  const fetchAffiliates = useCallback(async () => {
    try {
      const data = await apiClient.get('/admin/affiliates?status=APPROVED');
      setAffiliates(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load past payout batches
  const fetchPayoutBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const data = await apiClient.get('/admin/affiliate-payouts');
      setPayoutBatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliates();
    fetchPayoutBatches();
  }, [fetchAffiliates, fetchPayoutBatches]);

  // Load unpaid commissions for selected affiliate
  useEffect(() => {
    if (!selectedAffiliateId) {
      setCommissions([]);
      setSelectedCommissionIds([]);
      return;
    }

    const fetchCommissions = async () => {
      setLoadingCommissions(true);
      try {
        const data = await apiClient.get(`/admin/affiliates/${selectedAffiliateId}/commissions`);
        // Filter to CONFIRMED and unpaid
        const unpaid = data.filter(c => c.status === 'CONFIRMED');
        setCommissions(unpaid);
        setSelectedCommissionIds([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCommissions(false);
      }
    };

    fetchCommissions();
  }, [selectedAffiliateId]);

  const toggleSelectCommission = (id) => {
    if (selectedCommissionIds.includes(id)) {
      setSelectedCommissionIds(prev => prev.filter(cId => cId !== id));
    } else {
      setSelectedCommissionIds(prev => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCommissionIds.length === commissions.length) {
      setSelectedCommissionIds([]);
    } else {
      setSelectedCommissionIds(commissions.map(c => c.id));
    }
  };

  const handleCreatePayout = async () => {
    if (selectedCommissionIds.length === 0) {
      alert('Please select at least one commission to pay.');
      return;
    }

    try {
      await apiClient.post('/admin/affiliate-payouts', {
        affiliateId: parseInt(selectedAffiliateId, 10),
        commissionIds: selectedCommissionIds,
        notes: payoutNotes
      });

      alert('Payout batch created successfully.');
      setPayoutNotes('');
      setSelectedAffiliateId('');
      fetchPayoutBatches();
    } catch (err) {
      alert(err.message || 'Failed to create payout batch');
    }
  };

  const selectedCommissionsSum = commissions
    .filter(c => selectedCommissionIds.includes(c.id))
    .reduce((sum, c) => sum + c.commissionAmount, 0.00);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Coins className="w-7 h-7 text-teal-400" />
          Affiliate Payouts
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Batch confirm and track manual payments to affiliates.</p>
      </div>

      {/* Main Payout Setup Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Payout builder (left) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-400" /> Create Payout Batch
            </h3>

            {/* Affiliate selection */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Select Affiliate</label>
              <select
                value={selectedAffiliateId}
                onChange={e => setSelectedAffiliateId(e.target.value)}
                className="w-full bg-zinc-850 border border-zinc-750 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="">-- Choose Approved Affiliate --</option>
                {affiliates.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.userName} ({a.referralCode})
                  </option>
                ))}
              </select>
            </div>

            {selectedAffiliateId && (
              <>
                {loadingCommissions ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 rounded-full border-4 border-t-teal-500 border-zinc-800 animate-spin" />
                  </div>
                ) : commissions.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-4">No confirmed unpaid commissions found for this affiliate.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="text-xs font-bold text-zinc-400">Available Confirmed Commissions</span>
                      <button
                        onClick={handleSelectAll}
                        className="text-xs text-teal-400 hover:text-teal-300 font-bold"
                      >
                        {selectedCommissionIds.length === commissions.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {commissions.map(c => {
                        const isSelected = selectedCommissionIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleSelectCommission(c.id)}
                            className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected ? 'bg-teal-500/10 border-teal-500/35 ring-1 ring-teal-500/20' : 'bg-zinc-850 border-zinc-750'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="rounded text-teal-500 bg-zinc-900 border-zinc-750 w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-bold text-white">Order #{c.orderNumber}</span>
                                <span className="text-[10px] text-zinc-550 block">Ref Code: {c.commissionType === 'PERCENTAGE' ? `${c.commissionValue}%` : `₹${c.commissionValue}`}</span>
                              </div>
                            </div>
                            <span className="font-extrabold text-white text-xs">₹{c.commissionAmount.toLocaleString('en-IN')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Payout actions (right panel) */}
        {selectedAffiliateId && commissions.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Batch Summary</h3>
              <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-2xl">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Commissions Selected</span>
                <p className="font-bold text-white text-base mt-1">{selectedCommissionIds.length} items</p>
                <div className="border-t border-zinc-800/80 pt-3 mt-3 flex justify-between items-baseline">
                  <span className="text-xs text-zinc-400">Total Payout</span>
                  <span className="text-lg font-black text-teal-400">₹{selectedCommissionsSum.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">UTR / Transaction Notes</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-9876543, GPay Transfer"
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  className="w-full bg-zinc-850 border border-zinc-750 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <button
              onClick={handleCreatePayout}
              disabled={selectedCommissionIds.length === 0}
              className="w-full mt-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
            >
              Mark Batch Completed & Paid
            </button>
          </div>
        )}
      </div>

      {/* Past Payout Batches List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" /> Payout Batch Logs
        </h3>

        {loadingBatches ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 rounded-full border-4 border-t-teal-500 border-zinc-800 animate-spin" />
          </div>
        ) : payoutBatches.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-4 text-center">No past payout batches recorded.</p>
        ) : (
          <div className="overflow-x-auto border border-zinc-800/80 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-950/20">
                  <th className="py-3.5 px-6">Batch ID</th>
                  <th className="py-3.5 px-6">Affiliate</th>
                  <th className="py-3.5 px-6">Total Paid</th>
                  <th className="py-3.5 px-6">Processed At</th>
                  <th className="py-3.5 px-6">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-xs text-zinc-300">
                {payoutBatches.map(batch => (
                  <tr key={batch.id} className="hover:bg-zinc-850/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-white">#BTCH-{batch.id}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{batch.affiliateName}</div>
                      <span className="text-[10px] font-mono text-teal-400 font-bold">{batch.referralCode}</span>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-teal-400">₹{batch.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 text-zinc-500">
                      {new Date(batch.processedAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 text-zinc-400 italic">
                      {batch.notes || 'No transaction details'}
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
