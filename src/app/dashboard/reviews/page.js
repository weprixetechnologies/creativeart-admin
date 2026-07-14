'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../lib/api-client';
import {
  MessageSquare,
  Search,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Star,
  User,
  Package
} from 'lucide-react';

export default function ReviewsBoardPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/admin/reviews');
      setReviews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await apiClient.put(`/admin/reviews/${id}/status`, { status });
      await fetchReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = reviews.filter(rev => {
    return !search ||
      rev.productName?.toLowerCase().includes(search.toLowerCase()) ||
      rev.reviewerName?.toLowerCase().includes(search.toLowerCase()) ||
      rev.title?.toLowerCase().includes(search.toLowerCase()) ||
      rev.comment?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-purple-400" />
            Reviews Moderation
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Approve, reject, or delete customer product reviews</p>
        </div>
        <button
          onClick={fetchReviews}
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
            placeholder="Search reviews by product, reviewer name, or review content..."
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
          <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">No reviews found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(rev => (
            <div key={rev.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 hover:border-zinc-750 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-purple-400 shrink-0" />
                      {rev.productName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                      <User className="w-3.5 h-3.5" />
                      <span>{rev.reviewerName}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                    rev.status === 'APPROVED'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                      : rev.status === 'REJECTED'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                  }`}>
                    {rev.status}
                  </span>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5 pt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="space-y-1">
                  {rev.title && <h4 className="text-xs font-semibold text-zinc-200">{rev.title}</h4>}
                  <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-3 border border-zinc-850 rounded-xl">
                    {rev.comment || 'No text review comment provided.'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {rev.status === 'PENDING_MODERATION' && (
                <div className="flex gap-2.5 pt-3.5 border-t border-zinc-800/80 mt-4">
                  <button
                    onClick={() => handleStatusUpdate(rev.id, 'APPROVED')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(rev.id, 'REJECTED')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-950/20 hover:bg-rose-950/30 text-rose-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
