'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../../lib/api-client';
import { 
  ArrowLeft, 
  Loader, 
  AlertTriangle,
  Save,
  Package,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    categoryId: '',
    itemType: 'PRODUCT', // PRODUCT or PROJECT
    productType: 'SIMPLE', // SIMPLE, VARIABLE, CUSTOMISABLE
    name: '',
    slug: '',
    description: '',
    basePrice: '',
    advanceAmount: '',
    finalAmount: '',
    totalAmount: '',
    materialInstructions: '',
    status: 'DRAFT'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await apiClient.get('/categories');
      const flat = [];
      const flatten = (items, depth = 0) => {
        items.forEach(item => {
          flat.push({ ...item, depth });
          if (item.children) flatten(item.children, depth + 1);
        });
      };
      flatten(data);
      setCategories(flat);
      if (flat.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: String(flat[0].id) }));
      }
    } catch (err) {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const isProject = formData.itemType === 'PROJECT';

    // Pricing checks for PROJECT type
    let adv = null;
    let fin = null;
    let tot = null;

    if (isProject) {
      adv = parseFloat(formData.advanceAmount) || 0;
      fin = parseFloat(formData.finalAmount) || 0;
      tot = parseFloat(formData.totalAmount) || 0;

      if (tot !== adv + fin) {
        setError('Total Amount must equal Advance Amount + Final Amount.');
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      categoryId: parseInt(formData.categoryId, 10),
      itemType: formData.itemType,
      productType: isProject ? null : formData.productType,
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      basePrice: parseFloat(formData.basePrice) || 0,
      status: formData.status,
      // Project fields
      advanceAmount: isProject ? adv : null,
      finalAmount: isProject ? fin : null,
      totalAmount: isProject ? tot : null,
      materialInstructions: isProject ? formData.materialInstructions : null
    };

    try {
      const res = await apiClient.post('/admin/products', payload);
      router.push(`/dashboard/products/${res.id}/edit?saved=true`);
    } catch (err) {
      setError(err.message || 'Failed to create catalog item.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Loader className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p className="text-sm">Preparing creation workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link 
        href="/dashboard/products" 
        className="flex items-center text-xs text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Catalog Listing
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Create Catalog Item</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure basic information. You can add images, variants, and custom fields on the next screen.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Basic Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
          
          {/* Item Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Catalog Item Type</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'PRODUCT', title: 'Standard Product', desc: 'Ships pre-manufactured or custom made-to-order templates.' },
                { type: 'PROJECT', title: 'Made-to-Order Project', desc: 'Customers book, ship their own materials (e.g. flowers), and make split payments.' }
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    itemType: opt.type,
                    // Reset fields if switching
                    advanceAmount: '',
                    finalAmount: '',
                    totalAmount: ''
                  }))}
                  className={`
                    p-4 text-left rounded-2xl border text-sm transition-all duration-150 flex flex-col justify-between h-28 cursor-pointer
                    ${formData.itemType === opt.type 
                      ? 'bg-purple-600/10 border-purple-500 text-white' 
                      : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'}
                  `}
                >
                  <span className="font-bold">{opt.title}</span>
                  <span className="text-[10px] text-zinc-500 mt-1 leading-normal">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Type Selector (shown only if itemType is PRODUCT) */}
          {formData.itemType === 'PRODUCT' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Product Type Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'SIMPLE', title: 'Simple Product', desc: 'No size/color choices, flat price.' },
                  { type: 'VARIABLE', title: 'Variable Product', desc: 'Includes size, color, SKU options.' },
                  { type: 'CUSTOMISABLE', title: 'Customisable Template', desc: 'Requires customer engraving or text inputs.' }
                ].map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, productType: opt.type }))}
                    className={`
                      p-4 text-left rounded-2xl border text-xs transition-all duration-150 flex flex-col justify-between h-28 cursor-pointer
                      ${formData.productType === opt.type 
                        ? 'bg-purple-600/10 border-purple-500 text-white' 
                        : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'}
                    `}
                  >
                    <span className="font-bold">{opt.title}</span>
                    <span className="text-[9px] text-zinc-500 mt-1 leading-normal">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {'\u00A0'.repeat(cat.depth * 2)} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Item Display Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Preserved Flower Paperweight"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500"
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
                placeholder="e.g. preserved-flower-paperweight"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-mono text-purple-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Detailed Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a detailed description of the item including materials, customization notes, or timeline details..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Base Price */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Base Price (INR)</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-zinc-500 text-sm font-semibold">₹</span>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-3.5 text-sm text-white font-semibold focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* PROJECT split payments (shown only if itemType is PROJECT) */}
          {formData.itemType === 'PROJECT' && (
            <div className="space-y-4 border-t border-zinc-800/80 pt-6 animate-in fade-in duration-200">
              <h3 className="text-sm font-bold text-white flex items-center">
                <HelpCircle className="w-4 h-4 mr-2 text-blue-400" /> Made-to-Order Split Payments
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Advance Booking Fee</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="₹0.00"
                    value={formData.advanceAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, advanceAmount: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Final Delivery Balance</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="₹0.00"
                    value={formData.finalAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, finalAmount: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Total Estimated Cost</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="₹0.00"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Material Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Material Shipment Instructions</label>
                <textarea
                  rows={3}
                  value={formData.materialInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, materialInstructions: e.target.value }))}
                  placeholder="Tell the client how to dry, pack, and ship their raw materials (e.g., flowers, hair) to your workshop..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/dashboard/products"
            className="flex-1 py-3.5 border border-zinc-800 hover:bg-white/5 rounded-2xl font-bold text-sm text-zinc-400 hover:text-white transition-colors text-center cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-2xl font-bold text-sm transition-colors flex justify-center items-center cursor-pointer shadow-md shadow-purple-600/10"
          >
            {submitting ? <Loader className="w-5 h-5 animate-spin" /> : <span className="flex items-center"><Save className="w-4 h-4 mr-2" /> Save & Continue</span>}
          </button>
        </div>
      </form>
    </div>
  );
}
