'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';
import { MenuItemImage } from '@/components/ui/MenuItemImage';
import type { MenuItem, Category } from '@/types/database';

interface FormData {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  category_id: string;
  price: string;
  is_available: boolean;
}

const emptyForm: FormData = {
  name_en: '',
  name_ar: '',
  description_en: '',
  description_ar: '',
  category_id: '',
  price: '',
  is_available: true,
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = useCallback(async () => {
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from('menu_items').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    ]);
    if (itemsRes.error) {
      console.error('Fetch menu_items error:', itemsRes.error.message, itemsRes.error.details, itemsRes.error.hint);
    }
    if (catsRes.error) {
      console.error('Fetch categories error:', catsRes.error.message, catsRes.error.details, catsRes.error.hint);
    }
    setItems(itemsRes.data || []);
    setCategories(catsRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name_en: item.name_en,
      name_ar: item.name_ar,
      description_en: item.description_en || '',
      description_ar: item.description_ar || '',
      category_id: item.category_id,
      price: item.price.toString(),
      is_available: item.is_available ?? true,
    });
    setImageFile(null);
    setImagePreview(item.image_url || null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `items/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('menu-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Upload error:', error);
      toast.error(`Image upload failed: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('menu-images')
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name_en.trim() || !form.category_id || !form.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      let imageUrl = editingItem?.image_url || null;

      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (uploaded) imageUrl = uploaded;
        else {
          setSaving(false);
          return;
        }
      }

      const priceNum = parseFloat(form.price);
      if (isNaN(priceNum) || priceNum < 0) {
        toast.error('Invalid price value');
        setSaving(false);
        return;
      }

      const payload = {
        name_en: form.name_en.trim(),
        name_ar: form.name_ar.trim() || form.name_en.trim(),
        description_en: form.description_en.trim() || null,
        description_ar: form.description_ar.trim() || null,
        category_id: form.category_id,
        price: priceNum,
        is_available: form.is_available,
        image_url: imageUrl,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) {
          console.error('Update menu_item error:', error.message, error.details, error.hint, error.code);
          toast.error(`Update failed: ${error.message}`);
          setSaving(false);
          return;
        }
        toast.success('Item updated successfully');
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert(payload);
        if (error) {
          console.error('Insert menu_item error:', error.message, error.details, error.hint, error.code);
          toast.error(`Insert failed: ${error.message}`);
          setSaving(false);
          return;
        }
        toast.success('Item created successfully');
      }

      closeForm();
      fetchData();
    } catch (err: unknown) {
      console.error('Menu item save error (unexpected):', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Save failed — check console for details';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      toast.success('Item deleted');
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name_en || 'Unknown';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-heading">Menu Items</h2>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={openCreate}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Item
        </motion.button>
      </div>

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="bg-background-card rounded-2xl p-12 text-center shadow-card">
          <p className="text-text-muted">No menu items yet. Add your first item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background-card rounded-2xl overflow-hidden shadow-card"
            >
              <div className="relative w-full h-36">
                <MenuItemImage src={item.image_url} alt={item.name_en} sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-bold text-text-heading line-clamp-1">{item.name_en}</h3>
                  <span
                    className={clsx(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ms-2',
                      item.is_available !== false
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    )}
                  >
                    {item.is_available !== false ? 'Available' : 'Hidden'}
                  </span>
                </div>
                {item.name_ar && (
                  <p className="text-xs text-text-muted mb-1" dir="rtl">{item.name_ar}</p>
                )}
                <p className="text-xs text-text-muted mb-2">{getCategoryName(item.category_id)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">{item.price.toFixed(3)} KD</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-colors"
                      aria-label="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center text-text-secondary hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                      aria-label="Delete"
                    >
                      {deletingId === item.id ? (
                        <div className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-4 top-[5vh] bottom-[5vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[540px] bg-background-card rounded-2xl z-50 shadow-float overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-text-heading">
                    {editingItem ? 'Edit Item' : 'Add Item'}
                  </h3>
                  <button onClick={closeForm} className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center text-text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>

                {/* Image upload */}
                <div className="mb-5">
                  <label className="text-xs font-semibold text-text-secondary mb-2 block">Image</label>
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-border-light mb-2">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                  />
                </div>

                {/* Name EN */}
                <Field label="Name (English) *" value={form.name_en} onChange={(v) => setForm({ ...form, name_en: v })} />
                {/* Name AR */}
                <Field label="Name (Arabic)" value={form.name_ar} onChange={(v) => setForm({ ...form, name_ar: v })} dir="rtl" />
                {/* Description EN */}
                <Field label="Description (English)" value={form.description_en} onChange={(v) => setForm({ ...form, description_en: v })} multiline />
                {/* Description AR */}
                <Field label="Description (Arabic)" value={form.description_ar} onChange={(v) => setForm({ ...form, description_ar: v })} multiline dir="rtl" />

                {/* Category */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-text-secondary mb-1.5 block">Category *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full py-2.5 px-3 bg-background border border-border-light rounded-xl text-sm text-text-body focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name_en}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <Field label="Price (KD) *" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" />

                {/* Availability */}
                <div className="mb-6 flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_available}
                    onClick={() => setForm({ ...form, is_available: !form.is_available })}
                    className={clsx(
                      'relative w-11 h-6 rounded-full transition-colors',
                      form.is_available ? 'bg-primary' : 'bg-border-heavy'
                    )}
                  >
                    <span
                      className={clsx(
                        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                        form.is_available ? 'translate-x-[22px]' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                  <span className="text-sm text-text-body">Available on menu</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={closeForm}
                    className="flex-1 py-3 rounded-xl border border-border-medium text-sm font-semibold text-text-secondary hover:bg-border-light transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Saving...
                      </div>
                    ) : editingItem ? 'Update Item' : 'Create Item'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  dir?: 'rtl' | 'ltr';
}) {
  const cls =
    'w-full py-2.5 px-3 bg-background border border-border-light rounded-xl text-sm text-text-body focus:outline-none focus:border-primary transition-colors';
  return (
    <div className="mb-4">
      <label className="text-xs font-semibold text-text-secondary mb-1.5 block">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          rows={3}
          className={clsx(cls, 'resize-none')}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          step={type === 'number' ? '0.001' : undefined}
          className={cls}
        />
      )}
    </div>
  );
}
