'use client';

import { useState, useEffect } from 'react';
import apiClient from '../../../lib/api-client';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  AlertTriangle,
  X,
  Image as ImageIcon,
  Loader
} from 'lucide-react';

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    imageUrl: '',
    linkUrl: '',
    isActive: true,
    sortOrder: 0
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const appUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.thecreativeart.shop/api/v1';

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get('/banners/all');
      setBanners(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch banners.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData({ imageUrl: '', linkUrl: '', isActive: true, sortOrder: 0 });
    setFormError('');
    setFormOpen(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      imageUrl: banner.image_url,
      linkUrl: banner.link_url || '',
      isActive: banner.is_active,
      sortOrder: banner.sort_order || 0
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleImageFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadingImage(true);
    setFormError('');

    try {
      const timestamp = Date.now();
      const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uploadKey = `banners/${timestamp}_${fileName}`;
      const proxyUrl = `${appUrl}/storage/upload?key=${encodeURIComponent(uploadKey)}&contentType=${encodeURIComponent(file.type)}`;

      const uploadRes = await fetch(proxyUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadRes.ok) throw new Error('Upload failed.');
      const resJson = await uploadRes.json();

      setFormData(prev => ({ ...prev, imageUrl: resJson.data.fileUrl }));
    } catch (err) {
      setFormError(err.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    if (!formData.imageUrl) {
      setFormError('Image is required');
      setFormSubmitting(false);
      return;
    }

    const payload = {
      imageUrl: formData.imageUrl,
      linkUrl: formData.linkUrl || null,
      isActive: formData.isActive,
      sortOrder: parseInt(formData.sortOrder, 10) || 0
    };

    try {
      if (editingBanner) {
        await apiClient.put(`/banners/${editingBanner.id}`, payload);
        setSuccess('Banner updated successfully!');
      } else {
        await apiClient.post('/banners', payload);
        setSuccess('Banner created successfully!');
      }
      setFormOpen(false);
      fetchBanners();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err.message || 'Failed to save banner.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');

    try {
      await apiClient.delete(`/banners/${deleteTarget.id}`);
      setSuccess('Banner deleted successfully!');
      setDeleteTarget(null);
      fetchBanners();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete banner.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Banners</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage hero section banners for the website.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-medium text-sm shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Banner
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-400 text-sm flex items-center">
          <ChevronRight className="w-4 h-4 mr-2" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader className="w-8 h-8 animate-spin text-purple-500 mb-4" />
          </div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center">
            <ImageIcon className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-base font-semibold text-zinc-400">No banners found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {banners.map(banner => (
              <div key={banner.id} className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/40 rounded-2xl">
                <div className="flex flex-row items-center space-x-4">
                  <div className="w-40 h-24 bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                    <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex space-x-2 items-center">
                      <p className="text-white font-medium">Order: {banner.sort_order}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${banner.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {banner.link_url && (
                      <p className="text-sm text-zinc-400 mt-1">Link: {banner.link_url}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => openEditModal(banner)} className="p-2 bg-zinc-950 border border-zinc-850 text-amber-400 hover:bg-zinc-800 rounded-xl">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(banner)} className="p-2 bg-zinc-950 border border-zinc-850 text-rose-400 hover:bg-rose-500/10 rounded-xl">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="flex-1" onClick={() => setFormOpen(false)} />
          <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                <h2 className="text-lg font-bold text-white">
                  {editingBanner ? 'Edit Banner' : 'Create Banner'}
                </h2>
                <button onClick={() => setFormOpen(false)} className="p-2 text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Image Upload</label>
                  {formData.imageUrl && (
                    <div className="w-full h-32 bg-zinc-800 rounded-xl overflow-hidden mb-2">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={(e) => handleImageFileUpload(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`w-full py-3 bg-zinc-950 border border-dashed border-zinc-700 rounded-xl flex items-center justify-center text-sm font-medium ${uploadingImage ? 'text-zinc-500' : 'text-purple-400'}`}>
                      {uploadingImage ? 'Uploading...' : 'Choose Image'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Link URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5 flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 bg-zinc-900 border-zinc-800 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-white">
                    Active (visible on website)
                  </label>
                </div>
              </form>
            </div>

            <div className="pt-6 border-t border-zinc-800 flex gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 py-3 border border-zinc-800 rounded-xl font-bold text-sm text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={formSubmitting}
                className="flex-1 py-3 bg-purple-600 rounded-xl font-bold text-sm text-white flex justify-center items-center"
              >
                {formSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Save Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-6">
            <h3 className="text-base font-bold text-white text-rose-500">Delete Banner</h3>
            <p className="text-zinc-400 text-sm">Are you sure you want to delete this banner?</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-zinc-850 text-zinc-400 rounded-xl">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
