'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '../../../lib/api-client';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Copy,
  ChevronLeft, 
  ChevronRight,
  Loader,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState(''); // 'PRODUCT', 'PROJECT' or '' (all)
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState(''); // 'DRAFT', 'ACTIVE', 'ARCHIVED' or ''
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });

  // Delete target state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, itemType, categoryId, status, page]);

  const fetchCategories = async () => {
    try {
      const data = await apiClient.get('/categories');
      // Build a flat list helper for filtering
      const flat = [];
      const flatten = (list) => {
        list.forEach(c => {
          flat.push(c);
          if (c.children) flatten(c.children);
        });
      };
      flatten(data);
      setCategories(flat);
    } catch (err) {
      console.error('Failed to load categories for filtering:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const query = {
        page,
        limit,
        search: search || undefined,
        itemType: itemType || undefined,
        categoryId: categoryId || undefined,
        status: status || undefined
      };
      
      const res = await apiClient.get('/admin/products', {
        params: query
      });
      // In our fetch wrapper query params can be appended, but let's build url query string manual to be safe
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (search) params.append('search', search);
      if (itemType) params.append('itemType', itemType);
      if (categoryId) params.append('categoryId', categoryId);
      if (status) params.append('status', status);

      const data = await apiClient.get(`/admin/products?${params.toString()}`);
      setItems(data.data || data); // fallback in case api response is direct array or enveloped
      setMeta(data.meta || { total: data.length, page: 1, limit: 10 });
    } catch (err) {
      setError(err.message || 'Failed to fetch catalog items.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setError('');
    try {
      await apiClient.delete(`/admin/products/${deleteTarget.id}`);
      setSuccess('Catalog item deleted successfully!');
      setDeleteTarget(null);
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete catalog item.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleDuplicate = async (item) => {
    setError('');
    setSuccess('');
    try {
      // Fetch details first to get all data (variants, custom fields, images)
      const details = await apiClient.get(`/admin/products/${item.id}`);

      // Create cloned item payload
      const dupSlug = `${details.slug}-copy-${Math.floor(100 + Math.random() * 900)}`;
      const payload = {
        categoryId: details.category_id,
        itemType: details.item_type,
        productType: details.product_type,
        name: `${details.name} (Copy)`,
        slug: dupSlug,
        description: details.description,
        basePrice: details.base_price,
        advanceAmount: details.advance_amount,
        finalAmount: details.final_amount,
        totalAmount: details.total_amount,
        materialInstructions: details.material_instructions,
        status: 'DRAFT' // duplicate always starts as draft
      };

      const clonedProduct = await apiClient.post('/admin/products', payload);
      const cloneId = clonedProduct.id;

      // Copy Images
      if (details.images && details.images.length > 0) {
        for (const img of details.images) {
          await apiClient.post(`/admin/products/${cloneId}/images`, {
            action: 'add',
            url: img.url,
            isPrimary: !!img.is_primary,
            sortOrder: img.sort_order
          });
        }
      }

      // Copy Variants
      if (details.variants && details.variants.length > 0) {
        for (const v of details.variants) {
          // Parse attributes if string
          const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes;
          await apiClient.post(`/admin/products/${cloneId}/variants`, {
            sku: `${v.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`,
            attributes: attrs,
            priceOverride: v.price_override,
            stockQty: v.stock_qty,
            status: v.status
          });
        }
      }

      // Copy Custom Fields
      if (details.customFields && details.customFields.length > 0) {
        for (const f of details.customFields) {
          const opts = typeof f.options === 'string' ? JSON.parse(f.options) : f.options;
          const mime = typeof f.allowed_mime_types === 'string' ? JSON.parse(f.allowed_mime_types) : f.allowed_mime_types;
          await apiClient.post(`/admin/products/${cloneId}/custom-fields`, {
            fieldKey: `${f.field_key}_copy`,
            label: f.label,
            type: f.type,
            required: !!f.required,
            helpText: f.help_text,
            options: opts,
            maxFileSizeKb: f.max_file_size_kb,
            allowedMimeTypes: mime,
            sortOrder: f.sort_order
          });
        }
      }

      setSuccess(`Duplicated "${item.name}" successfully as Draft!`);
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to duplicate catalog item.');
    }
  };

  const totalPages = Math.ceil(meta.total / limit) || 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Catalog Items</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage products, custom templates, and made-to-order projects.</p>
        </div>
        <Link
          href="/dashboard/products/create"
          className="flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-medium text-sm transition-all duration-150 shadow-md shadow-purple-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Catalog Item
        </Link>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-400 text-sm flex items-center">
          <ChevronRight className="w-4 h-4 mr-2 animate-pulse" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative col-span-1 md:col-span-1">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Item Type filter */}
        <div className="relative">
          <select
            value={itemType}
            onChange={(e) => { setItemType(e.target.value); setPage(1); }}
            className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
          >
            <option value="">All Types (Product & Project)</option>
            <option value="PRODUCT">Standard Product</option>
            <option value="PROJECT">Made-to-Order Project</option>
          </select>
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-zinc-900/30 border border-zinc-800/85 rounded-3xl overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <p className="text-sm">Fetching catalog listing...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500 text-center">
            <Package className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-base font-semibold text-zinc-400">No items found</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">No products or projects match your filters. Try clearing them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4.5">Item Info</th>
                  <th className="px-6 py-4.5">Type Info</th>
                  <th className="px-6 py-4.5">Category</th>
                  <th className="px-6 py-4.5">Base Pricing</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {items.map((item) => {
                  const categoryName = categories.find(c => c.id === item.category_id)?.name || `ID: ${item.category_id}`;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[240px]">{item.name}</p>
                          <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate max-w-[240px]">/{item.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide
                            ${item.item_type === 'PRODUCT' ? 'bg-purple-950/20 text-purple-400 border border-purple-900/10' : 'bg-blue-950/20 text-blue-400 border border-blue-900/10'}
                          `}>
                            {item.item_type}
                          </span>
                          {item.item_type === 'PRODUCT' && (
                            <span className="text-[9px] text-zinc-500 font-semibold uppercase">
                              {item.product_type} template
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        <div className="flex items-center text-xs">
                          <Layers className="w-3.5 h-3.5 mr-1.5 text-zinc-600" />
                          {categoryName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">
                          ₹{item.base_price}
                          {item.item_type === 'PROJECT' && (
                            <div className="text-[10px] text-zinc-500 font-normal mt-0.5">
                              Split: ₹{item.advance_amount} + ₹{item.final_amount}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide
                          ${item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                          ${item.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                          ${item.status === 'ARCHIVED' ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50' : ''}
                        `}>
                          {item.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(item)}
                            className="p-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-850"
                            title="Duplicate Item"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {/* Edit */}
                          <Link
                            href={`/dashboard/products/${item.id}/edit`}
                            className="p-2 bg-zinc-950 hover:bg-zinc-850 text-amber-400 hover:text-amber-300 rounded-xl border border-zinc-850"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-2 bg-zinc-950 hover:bg-rose-500/10 hover:border-rose-500/25 text-rose-400 hover:text-rose-350 rounded-xl border border-zinc-850"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && items.length > 0 && (
          <div className="bg-zinc-900/30 border-t border-zinc-850 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-semibold">
              Showing page {page} of {totalPages} ({meta.total} items total)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 bg-zinc-950 border border-zinc-800/80 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-950 disabled:hover:text-zinc-400 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 bg-zinc-950 border border-zinc-800/80 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-950 disabled:hover:text-zinc-400 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3.5 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Delete Catalog Item</h3>
            </div>
            
            <p className="text-zinc-400 text-sm">
              Are you sure you want to delete <span className="font-semibold text-white">"{deleteTarget.name}"</span>? 
              All associated variants, image links, and custom fields will be cascadingly deleted. This cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                disabled={deleteSubmitting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-zinc-850 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteSubmitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white rounded-xl font-semibold text-sm transition-colors flex justify-center items-center cursor-pointer"
              >
                {deleteSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
