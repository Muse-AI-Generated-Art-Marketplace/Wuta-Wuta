import React, { useCallback, useRef, useState } from 'react';
import { RotateCcw, RotateCw, Upload, X, ZoomIn, ZoomOut } from 'lucide-react';

const FILTERS = [
  { label: 'None', value: 'none', css: '' },
  { label: 'Grayscale', value: 'grayscale', css: 'grayscale(100%)' },
  { label: 'Sepia', value: 'sepia', css: 'sepia(80%)' },
  { label: 'Vivid', value: 'vivid', css: 'saturate(200%) contrast(110%)' },
  { label: 'Cool', value: 'cool', css: 'hue-rotate(180deg) saturate(120%)' },
  { label: 'Warm', value: 'warm', css: 'sepia(40%) saturate(150%)' },
];

/**
 * ArtworkUploader — image upload with preview, crop (zoom + pan), rotate, and filter.
 *
 * Props:
 *   onImageReady(dataUrl: string) — called with the final processed image data URL
 */
const ArtworkUploader = ({ onImageReady }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState('none');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);

  const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE_MB = 10;

  const loadFile = useCallback((file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError('Unsupported file type. Please upload JPEG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      setRotation(0);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setFilter('none');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e) => loadFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    loadFile(e.dataTransfer.files[0]);
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = () => setIsDragging(false);

  const rotate = (deg) => setRotation((r) => (r + deg + 360) % 360);

  const selectedFilter = FILTERS.find((f) => f.value === filter) || FILTERS[0];

  const applyAndExport = () => {
    const canvas = canvasRef.current;
    const img = new Image();
    img.onload = () => {
      const SIZE = 512;
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');

      // Apply CSS filter via offscreen canvas trick using filter property
      ctx.filter = selectedFilter.css || 'none';
      ctx.save();
      ctx.translate(SIZE / 2 + pan.x, SIZE / 2 + pan.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      if (onImageReady) onImageReady(dataUrl);
    };
    img.src = imageSrc;
  };

  const reset = () => {
    setImageSrc(null);
    setRotation(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFilter('none');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {!imageSrc ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload artwork image"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50 p-10 text-center transition hover:border-purple-500 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-950/20"
        >
          <Upload className="h-10 w-10 text-purple-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Drag & drop or <span className="text-purple-600 underline">browse</span>
          </p>
          <p className="text-xs text-gray-400">JPEG, PNG, WebP, GIF · max {MAX_SIZE_MB} MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            onChange={handleFileChange}
            className="sr-only"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Preview with pan */}
          <div
            ref={previewRef}
            className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800"
            style={{ height: 300, cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            aria-label="Image preview — drag to reposition"
          >
            <img
              src={imageSrc}
              alt="Preview"
              draggable={false}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) rotate(${rotation}deg) scale(${zoom})`,
                filter: selectedFilter.css || 'none',
                maxWidth: 'none',
                userSelect: 'none',
                transition: isDragging ? 'none' : 'transform 0.15s ease',
              }}
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={reset}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Rotate */}
            <button
              type="button"
              aria-label="Rotate left 90°"
              onClick={() => rotate(-90)}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4" /> Left
            </button>
            <button
              type="button"
              aria-label="Rotate right 90°"
              onClick={() => rotate(90)}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <RotateCw className="h-4 w-4" /> Right
            </button>

            {/* Zoom */}
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-gray-600 dark:text-gray-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(1)))}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Filters */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Filter</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Image filters">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                    filter === f.value
                      ? 'bg-purple-600 text-white'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Apply button */}
          <button
            type="button"
            onClick={applyAndExport}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 py-3 font-semibold text-white transition hover:opacity-95"
          >
            Apply &amp; Use Image
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
};

export default ArtworkUploader;
