'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../lib/api-client';
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Mail,
  MessageSquare,
  Save,
  XCircle,
  FileText
} from 'lucide-react';

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [form, setForm] = useState({
    id: null, templateKey: '', channels: 'EMAIL,SMS', subjectTemplate: '', bodyTemplate: ''
  });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/admin/notifications/templates');
      setTemplates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const isEdit = !!form.id;
      if (isEdit) {
        await apiClient.put(`/admin/notifications/templates/${form.id}`, {
          channels: form.channels,
          subjectTemplate: form.subjectTemplate,
          bodyTemplate: form.bodyTemplate
        });
      } else {
        await apiClient.post('/admin/notifications/templates', form);
      }
      setShowFormModal(false);
      setForm({ id: null, templateKey: '', channels: 'EMAIL,SMS', subjectTemplate: '', bodyTemplate: '' });
      await fetchTemplates();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await apiClient.delete(`/admin/notifications/templates/${id}`);
      await fetchTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-purple-400" />
            Notification Templates
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Configure customer transaction templates and messaging channels</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setForm({ id: null, templateKey: '', channels: 'EMAIL,SMS', subjectTemplate: '', bodyTemplate: '' });
              setFormError(null);
              setShowFormModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-650 hover:bg-purple-650 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Template
          </button>
          <button
            onClick={fetchTemplates}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
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
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <FileText className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">No templates defined yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 hover:border-zinc-750 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-purple-400 font-bold text-sm bg-purple-500/10 border border-purple-500/15 px-2.5 py-0.5 rounded-md uppercase">
                    {t.templateKey}
                  </span>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-semibold bg-zinc-800/80 border border-zinc-750 px-2.5 py-0.5 rounded-md">
                    {t.channels.split(',').map(ch => (
                      <span key={ch} className="flex items-center gap-1">
                        {ch.trim() === 'EMAIL' ? <Mail className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        {ch.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  {t.subjectTemplate && (
                    <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                      <span className="text-zinc-500 font-medium">Subject:</span> {t.subjectTemplate}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 leading-relaxed font-mono bg-zinc-950 p-3.5 border border-zinc-800 rounded-xl whitespace-pre-wrap">
                    {t.bodyTemplate}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-4 border-t border-zinc-800/85 mt-4">
                <button
                  onClick={() => {
                    setForm({
                      id: t.id,
                      templateKey: t.templateKey,
                      channels: t.channels,
                      subjectTemplate: t.subjectTemplate || '',
                      bodyTemplate: t.bodyTemplate
                    });
                    setFormError(null);
                    setShowFormModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Template
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-rose-950/30 hover:text-rose-400 text-zinc-500 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                {form.id ? 'Edit Template' : 'New Template'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Template Key
                </label>
                <input
                  type="text"
                  value={form.templateKey}
                  onChange={e => setForm(f => ({ ...f, templateKey: e.target.value }))}
                  disabled={!!form.id}
                  className="w-full bg-zinc-850 border border-zinc-750 rounded-xl px-3.5 py-2.5 text-sm text-white disabled:opacity-50 focus:outline-none focus:border-purple-500 uppercase font-mono"
                  placeholder="e.g. ORDER_PLACED"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Channels (comma separated)
                </label>
                <input
                  type="text"
                  value={form.channels}
                  onChange={e => setForm(f => ({ ...f, channels: e.target.value }))}
                  className="w-full bg-zinc-850 border border-zinc-750 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 uppercase font-mono"
                  placeholder="EMAIL,SMS"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Subject Template
                </label>
                <input
                  type="text"
                  value={form.subjectTemplate}
                  onChange={e => setForm(f => ({ ...f, subjectTemplate: e.target.value }))}
                  className="w-full bg-zinc-850 border border-zinc-750 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="Subject Line (Supports {{customerName}}, {{orderNumber}})"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Body Template
                </label>
                <textarea
                  value={form.bodyTemplate}
                  onChange={e => setForm(f => ({ ...f, bodyTemplate: e.target.value }))}
                  rows={4}
                  className="w-full bg-zinc-850 border border-zinc-750 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="Hello {{customerName}}, your order {{orderNumber}} has been processed..."
                  required
                />
              </div>

              {formError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {formLoading ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
