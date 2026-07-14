'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../lib/api-client';
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Shield,
  Edit2,
  XCircle
} from 'lucide-react';

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Edit Role Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/admin/users');
      setStaff(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleRoleUpdate = async () => {
    if (!editingUser) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await apiClient.put(`/admin/users/${editingUser.id}/role`, { role: selectedRole });
      setEditingUser(null);
      await fetchStaff();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const filtered = staff.filter(u => {
    return !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-purple-400" />
            Staff Management
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Configure staff access controls, assign workflow roles, and audit permissions</p>
        </div>
        <button
          onClick={fetchStaff}
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
            placeholder="Search staff by name, email, or role..."
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
          <Users className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">No staff members found</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-900/50">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Created At</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-850/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">{u.name}</td>
                    <td className="py-4 px-6">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                          : u.role === 'STAFF_PRODUCTION'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                          : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20'
                      }`}>
                        <Shield className="w-3.5 h-3.5" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-zinc-500">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => { setEditingUser(u); setSelectedRole(u.role); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" /> Change Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                Change Access Role
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-zinc-850 rounded-xl p-3.5 border border-zinc-800 text-xs space-y-1">
                <p className="text-zinc-400"><span className="text-zinc-500">User:</span> {editingUser.name}</p>
                <p className="text-zinc-400"><span className="text-zinc-500">Email:</span> {editingUser.email}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Select Role
                </label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="STAFF_PRODUCTION">STAFF_PRODUCTION</option>
                  <option value="STAFF_PACKAGING">STAFF_PACKAGING</option>
                  <option value="CUSTOMER">CUSTOMER (Revoke Access)</option>
                </select>
              </div>

              {editError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {editError}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-850">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleUpdate}
                  disabled={editLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {editLoading ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
