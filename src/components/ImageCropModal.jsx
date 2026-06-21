// src/components/ImageCropModal.jsx
// Crop + zoom + reposition a photo into a square (shown round), then export a
// small compressed JPEG so the birthday-star photo loads fast on the invite page.
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

const OUTPUT = 640;        // exported square size in px
const QUALITY = 0.85;      // JPEG quality

async function getCroppedBlob(imageSrc, area) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT;
  canvas.height = OUTPUT;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT, OUTPUT);
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', QUALITY));
}

export default function ImageCropModal({ imageSrc, onCancel, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_area, areaPixels) => setPixels(areaPixels), []);

  async function handleSave() {
    if (!pixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imageSrc, pixels);
      await onSave(blob);
    } catch (e) {
      console.error('crop failed', e);
      setSaving(false);
    }
  }

  return (
    <div style={s.overlay} role="dialog" aria-modal="true">
      <div style={s.modal}>
        <h3 style={s.title}>Position the photo</h3>
        <div style={s.cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            restrictPosition
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div style={s.controls}>
          <span style={s.zoomLabel}>Zoom</span>
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1 }}
            aria-label="Zoom"
          />
        </div>
        <p style={s.hint}>Drag to move · pinch or use the slider to zoom</p>
        <div style={s.actions}>
          <button type="button" className="kb-btn kb-btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="button" className="kb-btn kb-btn-primary" onClick={handleSave} disabled={saving || !pixels}>
            {saving ? 'Saving…' : 'Save photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modal: {
    background: 'var(--kb-surface)', borderRadius: 20, padding: 20,
    width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: { fontFamily: 'var(--kb-font-display)', fontSize: 18, fontWeight: 700, color: 'var(--kb-text)', margin: '0 0 14px' },
  cropArea: { position: 'relative', width: '100%', height: 300, background: '#1c1c1c', borderRadius: 14, overflow: 'hidden' },
  controls: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 },
  zoomLabel: { fontSize: 13, color: 'var(--kb-text-muted)', fontWeight: 600 },
  hint: { fontSize: 12, color: 'var(--kb-text-muted)', textAlign: 'center', margin: '8px 0 0' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
};
