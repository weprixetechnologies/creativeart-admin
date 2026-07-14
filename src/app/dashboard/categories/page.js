'use client';

import { useState, useEffect } from 'react';
import apiClient from '../../../lib/api-client';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  FolderPlus,
  Loader,
  AlertTriangle,
  X
} from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Expanded node states
  const [expandedIds, setExpandedIds] = useState({});

  // Modal / Sidebar Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null means "Create" mode
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
    sortOrder: 0,
    status: 'ACTIVE'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Flat list helper for parents selector and reordering
  const [flatCategories, setFlatCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.get('/categories');
      setCategories(data);
      
      // Build a flat list helper
      const flat = [];
      const flatten = (items, depth = 0) => {
        items.forEach(item => {
          flat.push({ ...item, depth });
          if (item.children && item.children.length > 0) {
            flatten(item.children, depth + 1);
          }
        });
      };
      flatten(data);
      setFlatCategories(flat);

      // Auto-expand all roots initially
      const initialExpanded = {};
      data.forEach(cat => {
        initialExpanded[cat.id] = true;
      });
      setExpandedIds(prev => ({ ...initialExpanded, ...prev }));

    } catch (err) {
      setError(err.message || 'Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = (parentId = '') => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      parentId: parentId ? String(parentId) : '',
      sortOrder: 0,
      status: 'ACTIVE'
    });
    setFormError('');
    setFormOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      parentId: category.parent_id ? String(category.parent_id) : '',
      sortOrder: category.sort_order || 0,
      status: category.status || 'ACTIVE'
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleNameChange = (name) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    const payload = {
      name: formData.name,
      slug: formData.slug,
      parentId: formData.parentId ? parseInt(formData.parentId, 10) : null,
      sortOrder: parseInt(formData.sortOrder, 10) || 0,
      status: formData.status
    };

    try {
      if (editingCategory) {
        // Edit category
        await apiClient.put(`/admin/categories/${editingCategory.id}`, payload);
        setSuccess('Category updated successfully!');
      } else {
        // Create category
        await apiClient.post('/admin/categories', payload);
        setSuccess('Category created successfully!');
      }
      setFormOpen(false);
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err.message || 'Failed to save category.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');

    try {
      await apiClient.delete(`/admin/categories/${deleteTarget.id}`);
      setSuccess('Category deleted successfully!');
      setDeleteTarget(null);
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete category.');
    }
  };

  const handleMove = async (category, direction) => {
    // Find neighbors in flatCategories on the same parent level
    const siblings = flatCategories.filter(cat => cat.parent_id === category.parent_id);
    const index = siblings.findIndex(cat => cat.id === category.id);
    
    if (direction === 'up' && index > 0) {
      const neighbor = siblings[index - 1];
      await swapSortOrder(category, neighbor);
    } else if (direction === 'down' && index < siblings.length - 1) {
      const neighbor = siblings[index + 1];
      await swapSortOrder(category, neighbor);
    }
  };

  const swapSortOrder = async (catA, catB) => {
    try {
      const tempOrder = catA.sort_order;
      await apiClient.put(`/admin/categories/${catA.id}`, { sortOrder: catB.sort_order });
      await apiClient.put(`/admin/categories/${catB.id}`, { sortOrder: tempOrder });
      fetchCategories();
    } catch (err) {
      setError('Failed to update sort orders.');
    }
  };

  // Render tree item recursively
  const renderCategoryNode = (category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = !!expandedIds[category.id];

    return (
      <div key={category.id} className="select-none">
        {/* Row element */}
        <div 
          className="group flex items-center justify-between py-3.5 px-4 my-1 bg-zinc-900/40 border border-zinc-800/40 hover:bg-zinc-800/30 hover:border-zinc-700/35 rounded-2xl transition-all duration-150"
          style={{ marginLeft: `${depth * 28}px` }}
        >
          <div className="flex items-center space-x-3 min-w-0">
            {/* Collapse toggle */}
            <button 
              onClick={() => toggleExpand(category.id)}
              className={`p-1 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors ${!hasChildren && 'opacity-0 cursor-default'}`}
              disabled={!hasChildren}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Icon */}
            <div className={`p-2 rounded-xl border ${category.status === 'ACTIVE' ? 'bg-purple-950/10 border-purple-500/10 text-purple-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}>
              <Layers className="w-4 h-4" />
            </div>

            {/* Labels */}
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-sm text-white truncate">{category.name}</p>
                {category.status === 'ARCHIVED' && (
                  <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Archived</span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono truncate">/{category.slug}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
            {/* Sort order actions */}
            <button 
              onClick={() => handleMove(category, 'up')}
              className="p-2 bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800"
              title="Move Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => handleMove(category, 'down')}
              className="p-2 bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800"
              title="Move Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            {/* Add child */}
            <button 
              onClick={() => openCreateModal(category.id)}
              className="p-2 bg-zinc-950 border border-zinc-850 text-purple-400 hover:text-purple-300 rounded-xl hover:bg-zinc-850"
              title="Add Subcategory"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>

            {/* Edit */}
            <button 
              onClick={() => openEditModal(category)}
              className="p-2 bg-zinc-950 border border-zinc-850 text-amber-400 hover:text-amber-300 rounded-xl hover:bg-zinc-855"
              title="Edit Category"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button 
              onClick={() => setDeleteTarget(category)}
              className="p-2 bg-zinc-950 border border-zinc-850 text-rose-400 hover:text-rose-300 rounded-xl hover:bg-rose-500/10 hover:border-rose-500/20"
              title="Delete Category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children rendering */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Visual connector line */}
            <div 
              className="absolute left-6 top-1 bottom-1 w-px bg-zinc-800/40" 
              style={{ marginLeft: `${depth * 28}px` }} 
            />
            {category.children.map(child => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Product Categories</h1>
          <p className="text-zinc-400 text-sm mt-1">Organize catalog items into nested hierarchies and control sort order priorities.</p>
        </div>
        <button
          onClick={() => openCreateModal('')}
          className="flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-medium text-sm transition-all duration-150 shadow-md shadow-purple-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Root Category
        </button>
      </div>

      {/* Action status banners */}
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

      {/* Main categories listing content */}
      <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 min-h-[400px] flex flex-col justify-between">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <p className="text-sm">Loading categories tree...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500 text-center">
            <Layers className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-base font-semibold text-zinc-400">No categories found</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">Get started by creating your first root level catalog category.</p>
            <button
              onClick={() => openCreateModal('')}
              className="mt-4 px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-xs rounded-xl font-semibold transition-colors"
            >
              Create Category
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {categories.map(cat => renderCategoryNode(cat))}
          </div>
        )}
      </div>

      {/* Glassmorphic Modal / Sidebar for Category Create & Edit */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          {/* Overlay dismissal */}
          <div className="flex-1" onClick={() => setFormOpen(false)} />
          
          {/* Panel content */}
          <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 p-8 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                <h2 className="text-lg font-bold text-white">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
                </h2>
                <button 
                  onClick={() => setFormOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Parent selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Parent Category</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">[None] - Create as Root Level</option>
                    {flatCategories
                      .filter(cat => !editingCategory || (cat.id !== editingCategory.id && cat.parent_id !== editingCategory.id))
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {'\u00A0'.repeat(cat.depth * 2)} {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Display Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Photo Frames"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">URL Slug</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g. photo-frames"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-purple-400 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-zinc-500">Lowercase alphanumeric characters and hyphens only.</p>
                </div>

                {/* Sort Order */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Sort Order Priority</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Visibility Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['ACTIVE', 'ARCHIVED'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, status }))}
                        className={`
                          py-3 text-xs font-bold rounded-xl border uppercase tracking-wider cursor-pointer
                          ${formData.status === status 
                            ? 'bg-purple-600/10 border-purple-500 text-purple-400' 
                            : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300'}
                        `}
                      >
                        {status.toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-6 border-t border-zinc-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 py-3 border border-zinc-800 hover:bg-white/5 rounded-xl font-bold text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={formSubmitting}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl font-bold text-sm transition-colors flex justify-center items-center cursor-pointer"
              >
                {formSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3.5 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Delete Category</h3>
            </div>
            
            <p className="text-zinc-400 text-sm">
              Are you sure you want to delete <span className="font-semibold text-white">"{deleteTarget.name}"</span>? 
              This action is permanent and cannot be undone.
            </p>

            {deleteError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-xs">
                <p className="font-bold">Deletion Blocked</p>
                <p className="mt-1">{deleteError}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError('');
                }}
                className="flex-1 py-2.5 border border-zinc-850 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
