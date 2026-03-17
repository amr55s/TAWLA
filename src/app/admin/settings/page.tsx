'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Palette, Download, Check, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';


const FONT_OPTIONS = [
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Cairo', label: 'Cairo' },
  { value: 'Inter', label: 'Inter' },
];

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

interface ThemeData {
  primary: string;
  background: string;
  fontFamily?: string;
}

export default function AdminSettingsPage() {
  const supabase = createClient();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  const [primary, setPrimary] = useState('#1B4332');
  const [background, setBackground] = useState('#FAF8F5');
  const [fontFamily, setFontFamily] = useState('Tajawal');
  const [tableCount, setTableCount] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  const fetchRestaurant = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const resolvedId = user?.user_metadata?.restaurant_id as string | undefined;
      
      if (!resolvedId) {
        setRestaurantId(null);
        setLoading(false);
        return;
      }

      setRestaurantId(resolvedId);

      const { data, error } = await supabase
        .from('restaurants')
        .select('slug, theme_colors, table_count')
        .eq('id', resolvedId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching restaurant:', error.message, error.details, error.hint);
        setFetchError(error.message || 'Failed to load restaurant data');
        setLoading(false);
        return;
      }

      if (!data) {
        setFetchError(`No restaurant found with ID ${resolvedId}. Please run the seed SQL or check your user metadata.`);
        setLoading(false);
        return;
      }

      if (!data) {
        setFetchError('Restaurant data is empty.');
        setLoading(false);
        return;
      }

      setSlug(data.slug);
      
      if (data.table_count && typeof data.table_count === 'number') {
        setTableCount(data.table_count);
      }

      const tc = data.theme_colors as ThemeData | null;
      if (tc) {
        setPrimary(tc.primary || '#1B4332');
        setBackground(tc.background || '#FAF8F5');
        setFontFamily(tc.fontFamily || 'Tajawal');
      }
      setFetchError(null);
    } catch (err) {
      console.error('Unexpected settings fetch error:', err);
      setFetchError('Network error — could not reach Supabase.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRestaurant();
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, [fetchRestaurant]);

  const qrValue = baseUrl && slug ? `${baseUrl}/${slug}/menu` : '';

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 3;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${slug || 'restaurant'}-qr-code.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleSaveBranding = async () => {
    if (!HEX_RE.test(primary)) {
      toast.error('Primary color must be a valid hex (e.g. #1B4332)');
      return;
    }
    if (!HEX_RE.test(background)) {
      toast.error('Background color must be a valid hex (e.g. #FAF8F5)');
      return;
    }

    if (tableCount < 1 || tableCount > 200) {
      toast.error('Table count must be between 1 and 200');
      return;
    }

    setSaving(true);
    const theme: ThemeData = { primary, background, fontFamily };

    if (!restaurantId) {
      toast.error('No restaurant context. Please reload.');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('restaurants')
      .update({ theme_colors: theme, table_count: tableCount })
      .eq('id', restaurantId);

    if (error) {
      console.error('Branding update error:', error);
      toast.error(error.message || 'Failed to update branding');
    } else {
      toast.success('Branding updated successfully');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!restaurantId && !fetchError) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-background-card rounded-2xl shadow-card">
        Error: Your admin account is not linked to any restaurant. Please update your user metadata in Supabase.
      </div>
    );
  }

  if (fetchError) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-text-heading mb-6">Settings</h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background-card rounded-2xl shadow-card border border-border-light p-8"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-text-heading">Failed to load settings</h3>
            <p className="text-sm text-text-muted max-w-md">{fetchError}</p>
            <button
              onClick={() => { setLoading(true); setFetchError(null); fetchRestaurant(); }}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-heading mb-6">Settings</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Branding Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-background-card rounded-2xl shadow-card border border-border-light p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-heading">Restaurant Branding</h3>
              <p className="text-xs text-text-muted">Customize colors and font</p>
            </div>
          </div>

          <div className="space-y-4">
            <ColorField label="Primary Color" value={primary} onChange={setPrimary} />
            <ColorField label="Background Color" value={background} onChange={setBackground} />

            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full py-2.5 px-3 bg-background border border-border-light rounded-xl text-sm text-text-body focus:outline-none focus:border-primary transition-colors"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                Total Tables
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={tableCount}
                onChange={(e) => setTableCount(Number(e.target.value))}
                className="w-full py-2.5 px-3 bg-background border border-border-light rounded-xl text-sm text-text-body focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. 15"
              />
              <p className="text-[10px] text-text-muted mt-1.5">
                Automatically sizes the waiter dashboard grid.
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveBranding}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save Branding
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* QR Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-background-card rounded-2xl shadow-card border border-border-light p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <QrCode size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-heading">Universal QR Code</h3>
              <p className="text-xs text-text-muted">One code for the whole restaurant</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="w-full mb-2">
              <label className="text-xs font-semibold text-text-secondary mb-1.5 block text-left">
                Network Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://192.168.1.x:3000"
                className="w-full py-2.5 px-3 bg-background border border-border-light rounded-xl text-sm text-text-body focus:outline-none focus:border-primary transition-colors"
                style={{ direction: 'ltr' }}
              />
              <p className="text-[10px] text-text-muted mt-1 text-left">
                Edit this if waitstaff are verifying via local Wi-Fi.
              </p>
            </div>

            <div
              ref={qrRef}
              className="bg-white border border-border-light rounded-2xl p-6 shadow-sm"
            >
              {qrValue ? (
                <QRCodeSVG
                  value={qrValue}
                  size={180}
                  bgColor="transparent"
                  fgColor="#1a1a1a"
                  level="M"
                />
              ) : (
                <div className="w-[180px] h-[180px] flex items-center justify-center text-text-muted text-sm">
                  No slug found
                </div>
              )}
            </div>

            {qrValue && (
              <p className="text-xs text-text-muted text-center break-all max-w-[260px]">
                {qrValue}
              </p>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleDownloadQR}
              disabled={!qrValue}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <Download size={16} />
              Download QR Code
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl border border-border-medium flex-shrink-0"
          style={{ backgroundColor: HEX_RE.test(value) ? value : '#cccccc' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 py-2.5 px-3 bg-background border border-border-light rounded-xl text-sm text-text-body font-mono focus:outline-none focus:border-primary transition-colors"
        />
      </div>
    </div>
  );
}
