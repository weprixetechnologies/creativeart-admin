'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '../../../../../lib/api-client';
import { 
  ArrowLeft, 
  Loader, 
  AlertTriangle,
  Save,
  Package,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  Copy,
  Settings,
  Plus,
  Trash2,
  Calendar,
  Eye,
  DollarSign,
  FileText
} from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState('basic'); // basic, images, variants, fields, fulfillment
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Loaded Product Data
  const [product, setProduct] = useState(null);

  // Tab 1: Basic Info Form States
  const [basicForm, setBasicForm] = useState({
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    basePrice: '',
    status: 'DRAFT'
  });

  // Tab 2: Images States
  const [images, setImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageSubmitting, setImageSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]); // [{name, status: 'uploading'|'done'|'error', msg}]

  // Tab 3: Variants States
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({
    sku: '',
    attributes: {},
    priceOverride: '',
    stockQty: 0
  });
  // Bulk Generation States
  const [attributesList, setAttributesList] = useState([
    { name: 'Size', values: 'S, M, L' },
    { name: 'Color', values: 'Red, Blue' }
  ]);
  const [generatedRows, setGeneratedRows] = useState([]);
  const [bulkSkuPrefix, setBulkSkuPrefix] = useState('');
  const [bulkStock, setBulkStock] = useState('10');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [variantSubmitting, setVariantSubmitting] = useState(false);

  // Tab 4: Custom Fields States
  const [customFields, setCustomFields] = useState([]);
  const [newField, setNewField] = useState({
    fieldKey: '',
    label: '',
    type: 'TEXT', // TEXT, NUMBER, DROPDOWN, DATE, FILE, TEXTAREA
    required: false,
    helpText: '',
    optionsString: '', // comma-separated for DROPDOWN
    maxFileSizeKb: '',
    allowedMimeTypesString: '' // comma-separated
  });
  const [fieldSubmitting, setFieldSubmitting] = useState(false);

  // Tab 5: Fulfillment/Project split payment States
  const [fulfillmentForm, setFulfillmentForm] = useState({
    advanceAmount: '',
    finalAmount: '',
    totalAmount: '',
    materialInstructions: ''
  });

  useEffect(() => {
    if (searchParams.get('saved') === 'true') {
      setSuccess('Catalog item created successfully! Now manage assets/configurations.');
      setTimeout(() => setSuccess(''), 4000);
    }
    fetchInitData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInitData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch categories
      const catData = await apiClient.get('/categories');
      const flat = [];
      const flatten = (items, depth = 0) => {
        items.forEach(item => {
          flat.push({ ...item, depth });
          if (item.children) flatten(item.children, depth + 1);
        });
      };
      flatten(catData);
      setCategories(flat);

      // 2. Fetch product details
      const details = await apiClient.get(`/admin/products/${id}`);
      setProduct(details);

      // Load Form states
      setBasicForm({
        categoryId: String(details.category_id),
        name: details.name,
        slug: details.slug,
        description: details.description,
        basePrice: details.base_price,
        status: details.status
      });

      setImages(details.images || []);
      setVariants(details.variants || []);
      setCustomFields(details.customFields || []);

      setFulfillmentForm({
        advanceAmount: details.advance_amount || '',
        finalAmount: details.final_amount || '',
        totalAmount: details.total_amount || '',
        materialInstructions: details.material_instructions || ''
      });

    } catch (err) {
      setError(err.message || 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        categoryId: parseInt(basicForm.categoryId, 10),
        name: basicForm.name,
        slug: basicForm.slug,
        description: basicForm.description,
        basePrice: parseFloat(basicForm.basePrice) || 0,
        status: basicForm.status
      };
      await apiClient.put(`/admin/products/${id}`, payload);
      setSuccess('Basic information updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update basic info.');
    } finally {
      setSaving(false);
    }
  };

  const handleFulfillmentSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const adv = parseFloat(fulfillmentForm.advanceAmount) || 0;
    const fin = parseFloat(fulfillmentForm.finalAmount) || 0;
    const tot = parseFloat(fulfillmentForm.totalAmount) || 0;

    if (tot !== adv + fin) {
      setError('Validation Error: Advance Amount + Final Amount must equal the Total Amount.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        advanceAmount: adv,
        finalAmount: fin,
        totalAmount: tot,
        materialInstructions: fulfillmentForm.materialInstructions
      };
      await apiClient.put(`/admin/products/${id}`, payload);
      setSuccess('Fulfillment and Split Payment settings saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save fulfillment settings.');
    } finally {
      setSaving(false);
    }
  };

  // --- Image Actions ---
  const handleImageFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setUploadingImage(true);
    setError('');
    setSuccess('');

    // Initialise progress list
    setUploadProgress(fileArray.map(f => ({ name: f.name, status: 'uploading', msg: '' })));

    let currentImages = [...images];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const uploadKey = `product-assets/${id}/${fileName}`;

        const appUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const proxyUrl = `${appUrl}/storage/upload?key=${encodeURIComponent(uploadKey)}&contentType=${encodeURIComponent(file.type)}`;

        const uploadRes = await fetch(proxyUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file
        });

        if (!uploadRes.ok) throw new Error('Upload failed.');

        const resJson = await uploadRes.json();
        const fileUrl = resJson.data.fileUrl;

        const updated = await apiClient.post(`/admin/products/${id}/images`, {
          action: 'add',
          url: fileUrl,
          isPrimary: currentImages.length === 0,
          sortOrder: currentImages.length + 1
        });

        if (Array.isArray(updated)) {
          currentImages = updated;
        } else {
          currentImages = [...currentImages, updated];
        }

        setImages([...currentImages]);
        setUploadProgress(prev =>
          prev.map((p, idx) => idx === i ? { ...p, status: 'done', msg: 'Uploaded!' } : p)
        );
      } catch (err) {
        setUploadProgress(prev =>
          prev.map((p, idx) => idx === i ? { ...p, status: 'error', msg: err.message || 'Failed' } : p)
        );
      }
    }

    setUploadingImage(false);
    const successCount = fileArray.length;
    setSuccess(`${successCount} image(s) processed. Check status above.`);
    setTimeout(() => { setSuccess(''); setUploadProgress([]); }, 4000);
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!newImageUrl) return;
    setImageSubmitting(true);
    setError('');
    try {
      const updated = await apiClient.post(`/admin/products/${id}/images`, {
        action: 'add',
        url: newImageUrl,
        isPrimary: false,
        sortOrder: images.length + 1
      });
      // In service, add returns list of images or newly created image.
      // If it returns list, replace. If it returns single, append.
      // In our code, service returns list for setPrimary/delete, but single for add.
      // Let's refetch or update state
      setImages(Array.isArray(updated) ? updated : [...images, updated]);
      setNewImageUrl('');
      setSuccess('Image added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add image.');
    } finally {
      setImageSubmitting(false);
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    setError('');
    try {
      const updated = await apiClient.post(`/admin/products/${id}/images`, {
        action: 'set-primary',
        imageId
      });
      setImages(updated);
    } catch (err) {
      setError(err.message || 'Failed to set primary image.');
    }
  };

  const handleDeleteImage = async (imageId) => {
    setError('');
    try {
      const updated = await apiClient.post(`/admin/products/${id}/images`, {
        action: 'delete',
        imageId
      });
      setImages(updated);
    } catch (err) {
      setError(err.message || 'Failed to delete image.');
    }
  };

  const handleReorderImage = async (imageId, direction) => {
    const index = images.findIndex(img => img.id === imageId);
    if (direction === 'up' && index > 0) {
      await swapImageOrder(images[index], images[index - 1]);
    } else if (direction === 'down' && index < images.length - 1) {
      await swapImageOrder(images[index], images[index + 1]);
    }
  };

  const swapImageOrder = async (imgA, imgB) => {
    setError('');
    try {
      const updated = await apiClient.post(`/admin/products/${id}/images`, {
        action: 'reorder',
        images: [
          { id: imgA.id, sortOrder: imgB.sort_order },
          { id: imgB.id, sortOrder: imgA.sort_order }
        ]
      });
      setImages(updated);
    } catch (err) {
      setError(err.message || 'Failed to update image sorting order.');
    }
  };

  const generateVariations = () => {
    setError('');
    const validAttrs = attributesList.filter(a => a.name.trim() !== '' && a.values.trim() !== '');
    if (validAttrs.length === 0) {
      setError('Please add at least one attribute with values.');
      return;
    }

    const attrCombinations = validAttrs.map(a => {
      return {
        name: a.name.trim(),
        values: a.values.split(',').map(v => v.trim()).filter(v => v !== '')
      };
    });

    const cartesian = (arrays) => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(d => curr.values.map(e => ({ ...d, [curr.name]: e })));
      }, [{}]);
    };

    const combinations = cartesian(attrCombinations);

    const rows = combinations.map(combo => {
      const vals = Object.values(combo).map(v => v.toUpperCase().replace(/[^A-Z0-9]/g, ''));
      const generatedSku = `${bulkSkuPrefix ? bulkSkuPrefix.toUpperCase() : 'SKU'}-${vals.join('-')}`;
      return {
        sku: generatedSku,
        attributes: combo,
        priceOverride: bulkPrice,
        stockQty: bulkStock || '0'
      };
    });

    setGeneratedRows(rows);
  };

  const handleBulkAddVariants = async () => {
    if (generatedRows.length === 0) return;
    setBulkSubmitting(true);
    setError('');
    setSuccess('');
    let successCount = 0;
    let failCount = 0;
    try {
      for (const row of generatedRows) {
        try {
          const payload = {
            sku: row.sku.trim().toUpperCase(),
            attributes: row.attributes,
            priceOverride: row.priceOverride ? parseFloat(row.priceOverride) : null,
            stockQty: parseInt(row.stockQty, 10) || 0
          };
          await apiClient.post(`/admin/products/${id}/variants`, payload);
          successCount++;
        } catch (e) {
          console.error('Failed to create bulk variant SKU:', row.sku, e);
          failCount++;
        }
      }
      // Refetch variants
      const list = await apiClient.get(`/admin/products/${id}/variants`);
      setVariants(list);
      setGeneratedRows([]);
      if (failCount > 0) {
        setError(`Successfully added ${successCount} variants. ${failCount} failed (likely SKU duplicate).`);
      } else {
        setSuccess(`Successfully generated all ${successCount} variations!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Bulk variation process encountered an error.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // --- Variant Actions ---
  const handleAddVariant = async (e) => {
    e.preventDefault();
    setVariantSubmitting(true);
    setError('');
    try {
      const payload = {
        sku: newVariant.sku,
        attributes: newVariant.attributes,
        priceOverride: newVariant.priceOverride ? parseFloat(newVariant.priceOverride) : null,
        stockQty: parseInt(newVariant.stockQty, 10) || 0
      };
      await apiClient.post(`/admin/products/${id}/variants`, payload);
      // Refetch variants
      const list = await apiClient.get(`/admin/products/${id}/variants`);
      setVariants(list);
      setNewVariant({ sku: '', attributes: {}, priceOverride: '', stockQty: 0 });
      setSuccess('Variant added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add variant.');
    } finally {
      setVariantSubmitting(false);
    }
  };

  const handleDeleteVariant = async (vId) => {
    setError('');
    try {
      await apiClient.delete(`/admin/products/${id}/variants/${vId}`);
      setVariants(prev => prev.filter(v => v.id !== vId));
    } catch (err) {
      setError(err.message || 'Failed to delete variant.');
    }
  };

  const handleUpdateVariantStock = async (vId, newStock) => {
    setError('');
    try {
      const stockQty = parseInt(newStock, 10) || 0;
      await apiClient.put(`/admin/products/${id}/variants/${vId}`, { stockQty });
      setVariants(prev => prev.map(v => v.id === vId ? { ...v, stock_qty: stockQty } : v));
    } catch (err) {
      setError(err.message || 'Failed to update variant stock.');
    }
  };

  // --- Custom Fields Actions ---
  const handleAddField = async (e) => {
    e.preventDefault();
    setFieldSubmitting(true);
    setError('');
    try {
      let opts = null;
      if (newField.type === 'DROPDOWN') {
        opts = newField.optionsString.split(',').map(s => s.trim()).filter(Boolean);
      }

      let mimes = null;
      if (newField.type === 'FILE' && newField.allowedMimeTypesString) {
        mimes = newField.allowedMimeTypesString.split(',').map(s => s.trim()).filter(Boolean);
      }

      const payload = {
        fieldKey: newField.fieldKey,
        label: newField.label,
        type: newField.type,
        required: newField.required,
        helpText: newField.helpText || null,
        options: opts,
        maxFileSizeKb: newField.maxFileSizeKb ? parseInt(newField.maxFileSizeKb, 10) : null,
        allowedMimeTypes: mimes,
        sortOrder: customFields.length + 1
      };

      await apiClient.post(`/admin/products/${id}/custom-fields`, payload);
      const list = await apiClient.get(`/admin/products/${id}/custom-fields`);
      setCustomFields(list);
      setNewField({
        fieldKey: '',
        label: '',
        type: 'TEXT',
        required: false,
        helpText: '',
        optionsString: '',
        maxFileSizeKb: '',
        allowedMimeTypesString: ''
      });
      setSuccess('Custom configuration field added!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add custom field.');
    } finally {
      setFieldSubmitting(false);
    }
  };

  const handleDeleteField = async (fId) => {
    setError('');
    try {
      await apiClient.delete(`/admin/products/${id}/custom-fields/${fId}`);
      setCustomFields(prev => prev.filter(f => f.id !== fId));
    } catch (err) {
      setError(err.message || 'Failed to delete custom field.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Loader className="w-8 h-8 animate-spin text-purple-500 mb-4" />
        <p className="text-sm">Fetching item workspace...</p>
      </div>
    );
  }

  // Derived Type states
  const isProject = product.item_type === 'PROJECT';
  const isVariable = product.product_type === 'VARIABLE';
  const isCustomisable = product.product_type === 'CUSTOMISABLE' || isProject;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <Link 
        href="/dashboard/products" 
        className="flex items-center text-xs text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Catalog Listing
      </Link>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">{product.name}</h1>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold tracking-wide uppercase">
              {product.item_type}
            </span>
            {product.product_type && (
              <span className="text-[10px] bg-purple-950/20 text-purple-400 border border-purple-900/10 px-2 py-0.5 rounded font-bold tracking-wide uppercase">
                {product.product_type}
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-xs mt-1 font-mono">ID: {product.id} • Slug: /{product.slug}</p>
        </div>

        {/* Tab Selector Links */}
        <div className="flex bg-zinc-900 border border-zinc-800/80 p-1 rounded-2xl">
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'images', label: 'Images' },
            isVariable && { id: 'variants', label: 'Variants' },
            isCustomisable && { id: 'fields', label: 'Custom Fields' },
            isProject && { id: 'fulfillment', label: 'Fulfillment / Split' }
          ].filter(Boolean).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 text-xs font-bold rounded-xl transition-all uppercase tracking-wide cursor-pointer
                ${activeTab === tab.id 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10' 
                  : 'text-zinc-400 hover:text-zinc-200'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status banners */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-400 text-sm flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Workspace panel */}
      <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 sm:p-8">
        
        {/* --- TAB 1: BASIC INFO --- */}
        {activeTab === 'basic' && (
          <form onSubmit={handleBasicSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Display Title</label>
                <input
                  type="text"
                  required
                  value={basicForm.name}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">URL Slug</label>
                <input
                  type="text"
                  required
                  value={basicForm.slug}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-mono text-purple-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                <select
                  value={basicForm.categoryId}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {'\u00A0'.repeat(cat.depth * 2)} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Base Price (INR)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={basicForm.basePrice}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, basePrice: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-semibold text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description</label>
              <textarea
                required
                rows={4}
                value={basicForm.description}
                onChange={(e) => setBasicForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Catalog Visibility Status</label>
              <div className="grid grid-cols-3 gap-3">
                {['DRAFT', 'ACTIVE', 'ARCHIVED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setBasicForm(prev => ({ ...prev, status: st }))}
                    className={`
                      py-3 text-xs font-bold rounded-xl border uppercase tracking-wider cursor-pointer
                      ${basicForm.status === st 
                        ? 'bg-purple-600/10 border-purple-500 text-purple-400' 
                        : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300'}
                    `}
                  >
                    {st.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-2xl font-bold text-sm transition-colors flex items-center cursor-pointer shadow-md shadow-purple-600/10"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Basic Changes
            </button>
          </form>
        )}

        {/* --- TAB 2: IMAGES --- */}
        {activeTab === 'images' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Upload File or URL selection panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/40 border border-zinc-800 rounded-3xl p-5">
              {/* Option A: Direct File Upload */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Option A: Upload Image Files</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Select one or multiple JPEG, PNG, or WebP files. They will be uploaded sequentially.</p>
                </div>
                <div className="relative border-2 border-dashed border-zinc-800 hover:border-purple-500/50 bg-zinc-950 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImage}
                    onChange={(e) => handleImageFileUpload(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 mb-2 border border-zinc-800">
                    📸
                  </div>
                  <span className="text-xs font-bold text-zinc-300">
                    {uploadingImage ? 'Uploading images...' : 'Choose Image Files (Multi-select OK)'}
                  </span>
                  <span className="text-[9px] text-zinc-500 mt-1 uppercase">Max 5MB per file · PNG / JPG / WebP</span>
                </div>

                {/* Per-file upload progress */}
                {uploadProgress.length > 0 && (
                  <div className="space-y-1.5 mt-1">
                    {uploadProgress.map((p, i) => (
                      <div key={i} className={`flex items-center gap-2 text-[10px] rounded-lg px-3 py-1.5 ${
                        p.status === 'done' ? 'bg-emerald-500/10 text-emerald-400' :
                        p.status === 'error' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-zinc-800/60 text-zinc-400'
                      }`}>
                        <span className="shrink-0">
                          {p.status === 'done' ? '✓' : p.status === 'error' ? '✗' : '⋯'}
                        </span>
                        <span className="truncate flex-1 font-mono">{p.name}</span>
                        <span className="shrink-0">{p.msg}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Option B: Direct URL Input */}
              <form onSubmit={handleAddImage} className="space-y-3 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-900 pt-5 md:pt-0 md:pl-6">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Option B: Add Image Asset URL</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">Enter a direct image asset URL link from external CDNs or stock libraries.</p>
                </div>
                <div className="space-y-2">
                  <input
                    type="url"
                    required
                    placeholder="https://cly-pull-bunny.b-cdn.net/assets/image.png"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={imageSubmitting}
                    className="w-full py-3.5 bg-purple-650 hover:bg-purple-600 disabled:bg-purple-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {imageSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Add Image URL'}
                  </button>
                </div>
              </form>
            </div>

            {/* Images list */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gallery Assets ({images.length})</h3>
              
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-600">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <p className="text-xs">No image assets uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((img) => (
                    <div 
                      key={img.id}
                      className="group bg-zinc-950 border border-zinc-850 rounded-2xl overflow-hidden p-3 relative hover:border-zinc-700 transition-colors"
                    >
                      {/* Image Preview Box */}
                      <div className="w-full h-40 bg-zinc-900 border border-zinc-800/80 rounded-xl flex items-center justify-center overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={img.url} 
                          alt="Asset preview" 
                          className="object-cover w-full h-full"
                        />
                        {img.is_primary === 1 && (
                          <span className="absolute top-2 left-2 text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                            Primary Card
                          </span>
                        )}
                      </div>

                      {/* Info and Actions */}
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-[9px] text-zinc-500 font-semibold font-mono">Order: {img.sort_order}</span>
                        
                        <div className="flex items-center space-x-1">
                          {/* Reorders */}
                          <button
                            onClick={() => handleReorderImage(img.id, 'up')}
                            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-xs"
                            title="Move Sort Priority Up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleReorderImage(img.id, 'down')}
                            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-xs"
                            title="Move Sort Priority Down"
                          >
                            ▼
                          </button>

                          {/* Set Primary */}
                          {img.is_primary !== 1 && (
                            <button
                              onClick={() => handleSetPrimaryImage(img.id)}
                              className="px-2 py-1.5 bg-zinc-900 hover:bg-purple-950/20 hover:text-purple-400 text-zinc-400 rounded-lg text-[9px] font-bold uppercase tracking-wide border border-zinc-800/80"
                            >
                              Make Primary
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteImage(img.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-900/15"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 3: VARIANTS --- */}
        {activeTab === 'variants' && isVariable && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 1. Bulk Attribute Variation Generator */}
            <div className="space-y-4 bg-zinc-950/40 border border-zinc-800 rounded-3xl p-6">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Bulk Generate Variations</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Define attributes and values to generate Cartesian product variations instantly.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttributesList(prev => [...prev, { name: '', values: '' }])}
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  + Add Attribute
                </button>
              </div>

              {/* Attributes Rows */}
              <div className="space-y-3">
                {attributesList.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Attribute Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Size"
                          value={attr.name}
                          onChange={(e) => {
                            const newList = [...attributesList];
                            newList[idx].name = e.target.value;
                            setAttributesList(newList);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Values (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. S, M, L"
                          value={attr.values}
                          onChange={(e) => {
                            const newList = [...attributesList];
                            newList[idx].values = e.target.value;
                            setAttributesList(newList);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    {attributesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setAttributesList(prev => prev.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-400 text-xs font-bold uppercase py-2 px-1 mt-5 shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Bulk Default Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-zinc-900">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">SKU Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. TSHIRT"
                    value={bulkSkuPrefix}
                    onChange={(e) => setBulkSkuPrefix(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white uppercase focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Default Stock</label>
                  <input
                    type="number"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Default Price Override</label>
                  <input
                    type="number"
                    placeholder="Inherit base price"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={generateVariations}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-[#a855f7] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Generate Combinations
                </button>
              </div>

              {/* Generated combinations preview table */}
              {generatedRows.length > 0 && (
                <div className="space-y-4 pt-5 border-t border-zinc-900 animate-in fade-in duration-200">
                  <h4 className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-widest">
                    Generated Combinations Matrix ({generatedRows.length})
                  </h4>
                  
                  <div className="border border-zinc-855 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px] text-zinc-350">
                      <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-500 font-bold uppercase sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5">Attributes</th>
                          <th className="px-4 py-2.5">SKU</th>
                          <th className="px-4 py-2.5">Price Override</th>
                          <th className="px-4 py-2.5">Stock</th>
                          <th className="px-4 py-2.5 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 bg-zinc-950/20">
                        {generatedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/40">
                            <td className="px-4 py-2.5 text-zinc-400">
                              {Object.entries(row.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                value={row.sku}
                                onChange={(e) => {
                                  const updated = [...generatedRows];
                                  updated[idx].sku = e.target.value.toUpperCase();
                                  setGeneratedRows(updated);
                                }}
                                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                placeholder="Base Price"
                                value={row.priceOverride}
                                onChange={(e) => {
                                  const updated = [...generatedRows];
                                  updated[idx].priceOverride = e.target.value;
                                  setGeneratedRows(updated);
                                }}
                                className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                value={row.stockQty}
                                onChange={(e) => {
                                  const updated = [...generatedRows];
                                  updated[idx].stockQty = e.target.value;
                                  setGeneratedRows(updated);
                                }}
                                className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => setGeneratedRows(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-400 text-xs font-bold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBulkAddVariants}
                      disabled={bulkSubmitting}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      {bulkSubmitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Save All Variations'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeneratedRows([])}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Create Single Variant Form */}
            <form onSubmit={handleAddVariant} className="space-y-4 bg-zinc-950/40 border border-zinc-800 rounded-3xl p-5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Add Single Variant (Manual)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Variant SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="MUG-RED-L"
                    value={newVariant.sku}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Stock Qty</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50"
                    value={newVariant.stockQty}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, stockQty: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Price Override (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Falls back to base price"
                    value={newVariant.priceOverride}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, priceOverride: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Attributes JSON / KV</label>
                  <input
                    type="text"
                    required
                    placeholder='e.g. {"size":"L","color":"Red"}'
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setNewVariant(prev => ({ ...prev, attributes: parsed }));
                      } catch (err) {
                        // ignore parsing error while typing
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={variantSubmitting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center cursor-pointer"
              >
                {variantSubmitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Save Variant'}
              </button>
            </form>

            {/* List Existing Variants */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Product Variant Matrix ({variants.length})</h3>
              
              {variants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-650">
                  <Settings className="w-10 h-10 mb-2 animate-spin-slow" />
                  <p className="text-xs">No variants configured for this product yet.</p>
                </div>
              ) : (
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs text-zinc-300">
                    <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-450 font-bold uppercase">
                      <tr>
                        <th className="px-5 py-3.5">SKU</th>
                        <th className="px-5 py-3.5">Attributes</th>
                        <th className="px-5 py-3.5">Price Override</th>
                        <th className="px-5 py-3.5">Stock Quantity</th>
                        <th className="px-5 py-3.5 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {variants.map((v) => {
                        const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes;
                        return (
                          <tr key={v.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-3 font-semibold text-white font-mono">{v.sku}</td>
                            <td className="px-5 py-3 text-zinc-400">
                              {Object.entries(attrs).map(([key, val]) => (
                                <span key={key} className="inline-block bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded mr-2 border border-zinc-800">
                                  {key}: {val}
                                </span>
                              ))}
                            </td>
                            <td className="px-5 py-3 font-semibold text-zinc-300">
                              {v.price_override ? `₹${v.price_override}` : '[Inherited]'}
                            </td>
                            <td className="px-5 py-3">
                              <input
                                type="number"
                                value={v.stock_qty}
                                onChange={(e) => handleUpdateVariantStock(v.id, e.target.value)}
                                className="w-20 bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1 text-center text-white"
                              />
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={() => handleDeleteVariant(v.id)}
                                className="text-rose-450 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 4: CUSTOM CONFIGURATION FIELDS --- */}
        {activeTab === 'fields' && isCustomisable && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Configuration Builder */}
              <div className="space-y-6">
                <form onSubmit={handleAddField} className="space-y-4 bg-zinc-950/40 border border-zinc-800 rounded-3xl p-5">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Configure Custom Input Field</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Field Key (Unique ID)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. engraving_text"
                        value={newField.fieldKey}
                        onChange={(e) => setNewField(prev => ({ ...prev, fieldKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Label */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Display Label</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Engraving Message"
                        value={newField.label}
                        onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Input Type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Input Type Format</label>
                      <select
                        value={newField.type}
                        onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="TEXT">Short Text (TEXT)</option>
                        <option value="NUMBER">Number (NUMBER)</option>
                        <option value="DROPDOWN">Options Dropdown (DROPDOWN)</option>
                        <option value="DATE">Calendar Selection (DATE)</option>
                        <option value="FILE">Document Upload (FILE)</option>
                        <option value="TEXTAREA">Multi-line Text (TEXTAREA)</option>
                      </select>
                    </div>

                    {/* Required Toggle */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <label className="flex items-center space-x-2.5 py-2.5 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newField.required}
                          onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-zinc-300">Required Field</span>
                      </label>
                    </div>
                  </div>

                  {/* Dropdown specific inputs */}
                  {newField.type === 'DROPDOWN' && (
                    <div className="space-y-1.5 animate-in slide-in-from-top duration-150">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Dropdown Choices (comma-separated)</label>
                      <input
                        type="text"
                        required
                        placeholder="Serif, Sans-Serif, Comic Sans"
                        value={newField.optionsString}
                        onChange={(e) => setNewField(prev => ({ ...prev, optionsString: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}

                  {/* File constraints inputs */}
                  {newField.type === 'FILE' && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top duration-150">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Max File Size (KB)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5120"
                          value={newField.maxFileSizeKb}
                          onChange={(e) => setNewField(prev => ({ ...prev, maxFileSizeKb: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">MIME Types (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="image/png, image/jpeg, application/pdf"
                          value={newField.allowedMimeTypesString}
                          onChange={(e) => setNewField(prev => ({ ...prev, allowedMimeTypesString: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Help text */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Instructions Helper Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Max 20 characters including spaces."
                      value={newField.helpText}
                      onChange={(e) => setNewField(prev => ({ ...prev, helpText: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={fieldSubmitting}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center cursor-pointer"
                  >
                    {fieldSubmitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Save Field'}
                  </button>
                </form>

                {/* Listing added custom fields */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Configuration Rules</h4>
                  {customFields.length === 0 ? (
                    <p className="text-xs text-zinc-650 italic">No custom fields defined. Simple templates will buy without options.</p>
                  ) : (
                    <div className="space-y-2">
                      {customFields.map((f) => (
                        <div key={f.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-850 p-4 rounded-2xl hover:border-zinc-800 transition-colors">
                          <div>
                            <p className="font-semibold text-xs text-white flex items-center">
                              {f.label} 
                              {f.required === 1 && <span className="text-[8px] bg-rose-600/10 text-rose-500 border border-rose-900/10 px-1 rounded ml-2">Required</span>}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">Key: {f.field_key} • Format: {f.type}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteField(f.id)}
                            className="text-rose-500 hover:text-rose-400 p-2 hover:bg-white/5 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Live Preview Panel */}
              <div className="border border-zinc-800 rounded-3xl bg-zinc-950/20 p-6 space-y-6">
                <div className="flex items-center space-x-2 text-zinc-400 pb-3 border-b border-zinc-800">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">PDP Visual Live Preview</h3>
                </div>

                <div className="space-y-4">
                  {customFields.length === 0 ? (
                    <div className="py-12 text-center text-zinc-650 italic">
                      <p className="text-xs">Configure inputs on the left side to preview the design layout in real-time.</p>
                    </div>
                  ) : (
                    customFields.map((field) => {
                      const opts = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
                      return (
                        <div key={field.id} className="space-y-1.5 animate-in slide-in-from-bottom-2 duration-150">
                          <label className="text-xs font-bold text-zinc-300 flex items-center">
                            {field.label}
                            {field.required === 1 && <span className="text-rose-500 ml-1 font-semibold">*</span>}
                          </label>
                          
                          {field.type === 'TEXT' && (
                            <input 
                              type="text" 
                              placeholder={`Input ${field.label.toLowerCase()}...`}
                              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-3 text-xs text-white"
                              disabled
                            />
                          )}

                          {field.type === 'NUMBER' && (
                            <input 
                              type="number" 
                              placeholder="0"
                              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-3 text-xs text-white"
                              disabled
                            />
                          )}

                          {field.type === 'DATE' && (
                            <div className="relative">
                              <input 
                                type="date" 
                                className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-3 text-xs text-white"
                                disabled
                              />
                            </div>
                          )}

                          {field.type === 'DROPDOWN' && (
                            <select 
                              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-3 text-xs text-white appearance-none"
                              disabled
                            >
                              <option>Select choice...</option>
                              {Array.isArray(opts) && opts.map(o => (
                                <option key={o}>{o}</option>
                              ))}
                            </select>
                          )}

                          {field.type === 'TEXTAREA' && (
                            <textarea 
                              rows={2}
                              placeholder={`Type detailed ${field.label.toLowerCase()}...`}
                              className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-3 text-xs text-white resize-none"
                              disabled
                            />
                          )}

                          {field.type === 'FILE' && (
                            <div className="border border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center bg-zinc-950/40">
                              <ImageIcon className="w-6 h-6 text-zinc-650 mb-1" />
                              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">Upload Custom File</span>
                              {field.max_file_size_kb && (
                                <span className="text-[9px] text-zinc-600 mt-0.5">Max allowed size: {field.max_file_size_kb} KB</span>
                              )}
                            </div>
                          )}

                          {field.help_text && (
                            <p className="text-[10px] text-zinc-500 italic mt-0.5">{field.help_text}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 5: FULFILLMENT & SPLIT PAYMENTS --- */}
        {activeTab === 'fulfillment' && isProject && (
          <form onSubmit={handleFulfillmentSubmit} className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-white flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-blue-400" /> Payment Splits & Shipment Setup
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Booking Advance Deposit (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={fulfillmentForm.advanceAmount}
                  onChange={(e) => setFulfillmentForm(prev => ({ ...prev, advanceAmount: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Delivery Final Balance (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={fulfillmentForm.finalAmount}
                  onChange={(e) => setFulfillmentForm(prev => ({ ...prev, finalAmount: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Stated Cost (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={fulfillmentForm.totalAmount}
                  onChange={(e) => setFulfillmentForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white font-bold"
                />
              </div>
            </div>

            {/* Sum check alerts */}
            {parseFloat(fulfillmentForm.totalAmount) !== (parseFloat(fulfillmentForm.advanceAmount) || 0) + (parseFloat(fulfillmentForm.finalAmount) || 0) && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-xs flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Pricing mismatch: Advance (₹{fulfillmentForm.advanceAmount || 0}) + Final (₹{fulfillmentForm.finalAmount || 0}) must sum exactly to Total (₹{fulfillmentForm.totalAmount || 0}).
              </div>
            )}

            {/* Material shipment instructions */}
            <div className="space-y-1.5 border-t border-zinc-800 pt-6">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 mr-1.5 text-zinc-550" /> Custom Instructions for clients (Dry/Pack/Ship)
              </label>
              <textarea
                rows={5}
                required
                value={fulfillmentForm.materialInstructions}
                onChange={(e) => setFulfillmentForm(prev => ({ ...prev, materialInstructions: e.target.value }))}
                placeholder="Pack flowers in dry newspaper, label the box clearly, send using trusted speedpost..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || (parseFloat(fulfillmentForm.totalAmount) !== (parseFloat(fulfillmentForm.advanceAmount) || 0) + (parseFloat(fulfillmentForm.finalAmount) || 0))}
              className="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-2xl font-bold text-sm transition-colors flex items-center cursor-pointer shadow-md shadow-purple-600/10"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Fulfillment Rules
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
