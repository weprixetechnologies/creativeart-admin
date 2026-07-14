'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../lib/api-client';
import {
  Settings,
  Sliders,
  MapPin,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Globe,
  Phone,
  Truck,
  User
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('fulfillment');
  const [settings, setSettings] = useState({ stuck_order_sweep_threshold_days: '14' });
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Settings Form State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Address CRUD Modal/Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    id: null, label: '', contactName: '', contactPhone: '',
    line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', status: 'ACTIVE'
  });
  const [addrFormError, setAddrFormError] = useState(null);
  const [addrFormLoading, setAddrFormLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsData, addressesData, affiliateSettingsData] = await Promise.all([
        apiClient.get('/admin/settings'),
        apiClient.get('/admin/office-addresses'),
        apiClient.get('/admin/affiliate-settings').catch(() => ({}))
      ]);
      setSettings({ ...settingsData, ...affiliateSettingsData });
      setAddresses(addressesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);
    try {
      if (activeTab === 'affiliate') {
        const payload = {
          affiliate_default_commission_type: settings.affiliate_default_commission_type,
          affiliate_default_commission_value: settings.affiliate_default_commission_value,
          affiliate_cookie_window_days: settings.affiliate_cookie_window_days,
          affiliate_min_payout_threshold: settings.affiliate_min_payout_threshold
        };
        await apiClient.put('/admin/affiliate-settings', payload);
      } else {
        await apiClient.put('/admin/settings', settings);
      }
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleEditAddress = (addr) => {
    setAddressForm({
      id: addr.id,
      label: addr.label,
      contactName: addr.contactName,
      contactPhone: addr.contactPhone,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country || 'India',
      status: addr.status
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this office address?')) return;
    try {
      await apiClient.delete(`/admin/office-addresses/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddrFormLoading(true);
    setAddrFormError(null);
    try {
      const isEdit = !!addressForm.id;
      const payload = { ...addressForm };
      delete payload.id;

      if (isEdit) {
        await apiClient.put(`/admin/office-addresses/${addressForm.id}`, payload);
      } else {
        await apiClient.post('/admin/office-addresses', payload);
      }

      setShowAddressForm(false);
      setAddressForm({
        id: null, label: '', contactName: '', contactPhone: '',
        line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', status: 'ACTIVE'
      });
      await loadAll();
    } catch (err) {
      setAddrFormError(err.message);
    } finally {
      setAddrFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-purple-400" />
            System Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Configure global fulfillment thresholds and office delivery addresses</p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reload
        </button>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Tabs Sidebar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2.5 space-y-1 md:col-span-1">
            {[
              { id: 'fulfillment', label: 'Fulfillment', icon: Sliders },
              { id: 'office-addresses', label: 'Office Addresses', icon: MapPin },
              { id: 'shipping', label: 'Shipping', icon: Truck },
              { id: 'affiliate', label: 'Affiliate Settings', icon: Globe }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setShowAddressForm(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Panel */}
          <div className="md:col-span-3">
            {activeTab === 'fulfillment' && (
              <form onSubmit={saveSettings} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" /> Fulfillment Settings
                  </h2>
                  <p className="text-xs text-zinc-500">Configure global triggers and timeouts for custom project workflow</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Stuck Order Sweep Threshold (Days)
                    </label>
                    <input
                      type="number"
                      value={settings.stuck_order_sweep_threshold_days || ''}
                      onChange={e => setSettings(s => ({ ...s, stuck_order_sweep_threshold_days: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      The number of days an order can stay in the same status before the background sweep flags it as ON_HOLD.
                    </p>
                  </div>
                </div>

                {settingsSuccess && (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Settings updated successfully.
                  </p>
                )}

                <div className="flex justify-end pt-2 border-t border-zinc-850">
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {settingsLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'office-addresses' && !showAddressForm && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400" /> Intake Hubs
                    </h2>
                    <p className="text-xs text-zinc-500">Configure global warehouse addresses for customers to ship custom materials to</p>
                  </div>
                  <button
                    onClick={() => {
                      setAddressForm({
                        id: null, label: '', contactName: '', contactPhone: '',
                        line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', status: 'ACTIVE'
                      });
                      setShowAddressForm(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Address
                  </button>
                </div>

                <div className="space-y-3">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`border rounded-2xl p-4 bg-zinc-800/20 flex justify-between items-start gap-4 transition-all ${
                        addr.status === 'ACTIVE' ? 'border-zinc-850 hover:border-zinc-700' : 'border-zinc-800 opacity-60'
                      }`}
                    >
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-semibold text-white">{addr.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            addr.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}>
                            {addr.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                        <p className="text-xs text-zinc-500">{addr.city}, {addr.state} — {addr.pincode}</p>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500 font-semibold">
                          <span className="flex items-center gap-1"><User className="w-3 h-3 text-zinc-600" /> {addr.contactName}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-zinc-600" /> {addr.contactPhone}</span>
                        </div>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditAddress(addr)}
                          className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-zinc-650 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {addresses.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-650">
                      <MapPin className="w-10 h-10 opacity-30 mb-2" />
                      <p className="text-xs">No warehouse addresses configured.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'office-addresses' && showAddressForm && (
              <form onSubmit={handleAddressSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    {addressForm.id ? 'Edit Intake Hub' : 'Add Intake Hub'}
                  </h2>
                  <p className="text-xs text-zinc-500">Configure delivery details for customer material intake shipments</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'label', label: 'Label *', placeholder: 'e.g. Guwahati Intake Hub' },
                    { key: 'contactName', label: 'Contact Name *', placeholder: 'e.g. Warehouse Manager' },
                    { key: 'contactPhone', label: 'Contact Phone *', placeholder: 'e.g. +91 9876543210' },
                    { key: 'line1', label: 'Address Line 1 *', placeholder: 'e.g. 123 Assam Bypass Rd' },
                    { key: 'line2', label: 'Address Line 2 (Optional)', placeholder: 'e.g. Phase 2, Industrial Estate' },
                    { key: 'city', label: 'City *', placeholder: 'e.g. Guwahati' },
                    { key: 'state', label: 'State *', placeholder: 'e.g. Assam' },
                    { key: 'pincode', label: 'Pincode *', placeholder: 'e.g. 781001' },
                    { key: 'country', label: 'Country', placeholder: 'e.g. India' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">{label}</label>
                      <input
                        type="text"
                        value={addressForm[key]}
                        onChange={e => setAddressForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-purple-500"
                        required={label.includes('*')}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Status</label>
                    <select
                      value={addressForm.status}
                      onChange={e => setAddressForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                {addrFormError && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{addrFormError}</p>
                )}

                <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-850">
                  <button
                    type="button"
                    onClick={() => { setShowAddressForm(false); setAddrFormError(null); }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addrFormLoading}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    {addrFormLoading ? 'Saving...' : 'Save Hub'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'shipping' && (
              <form onSubmit={saveSettings} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-purple-400" /> Shipping Settings
                  </h2>
                  <p className="text-xs text-zinc-500">Configure Shiprocket API credentials, defaults, and pickup location</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Shiprocket API Email
                    </label>
                    <input
                      type="email"
                      value={settings.shiprocket_email || ''}
                      onChange={e => setSettings(s => ({ ...s, shiprocket_email: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Shiprocket API Password
                    </label>
                    <input
                      type="password"
                      value={settings.shiprocket_password || ''}
                      onChange={e => setSettings(s => ({ ...s, shiprocket_password: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Pickup Location Nickname
                    </label>
                    <input
                      type="text"
                      value={settings.shiprocket_pickup_location || ''}
                      onChange={e => setSettings(s => ({ ...s, shiprocket_pickup_location: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {settingsSuccess && (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Settings updated successfully.
                  </p>
                )}

                <div className="flex justify-end pt-2 border-t border-zinc-850">
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {settingsLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'affiliate' && (
              <form onSubmit={saveSettings} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" /> Affiliate Network Settings
                  </h2>
                  <p className="text-xs text-zinc-500">Configure default commissions, referral cookie parameters, and thresholds.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Default Commission Type
                      </label>
                      <select
                        value={settings.affiliate_default_commission_type || 'PERCENTAGE'}
                        onChange={e => setSettings(s => ({ ...s, affiliate_default_commission_type: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="PERCENTAGE">PERCENTAGE (%)</option>
                        <option value="FLAT">FLAT AMOUNT (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Default Commission Value
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.affiliate_default_commission_value || '10.00'}
                        onChange={e => setSettings(s => ({ ...s, affiliate_default_commission_value: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Cookie Window (Days)
                      </label>
                      <input
                        type="number"
                        value={settings.affiliate_cookie_window_days || '30'}
                        onChange={e => setSettings(s => ({ ...s, affiliate_cookie_window_days: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                        Min Payout Threshold (₹)
                      </label>
                      <input
                        type="number"
                        value={settings.affiliate_min_payout_threshold || '0'}
                        onChange={e => setSettings(s => ({ ...s, affiliate_min_payout_threshold: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {settingsSuccess && (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Settings updated successfully.
                  </p>
                )}

                <div className="flex justify-end pt-2 border-t border-zinc-850">
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {settingsLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
