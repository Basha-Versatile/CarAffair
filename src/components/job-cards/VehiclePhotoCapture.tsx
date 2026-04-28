'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, MapPin, Clock, Trash2, Loader2, X, RefreshCw, Aperture, Upload } from 'lucide-react';
import type { VehiclePhoto } from '@/types';
import { generateId } from '@/utils/format';

interface VehiclePhotoCaptureProps {
  photos: VehiclePhoto[];
  onChange: (photos: VehiclePhoto[]) => void;
}

function getCurrentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
    );
  });
}

function frameToDataUrl(video: HTMLVideoElement, maxSize = 1280, quality = 0.85): string {
  const w = video.videoWidth || video.clientWidth;
  const h = video.videoHeight || video.clientHeight;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function downscaleImage(dataUrl: string, maxSize = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function VehiclePhotoCapture({ photos, onChange }: VehiclePhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [viewingPhoto, setViewingPhoto] = useState<VehiclePhoto | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startStream = useCallback(async (mode: 'environment' | 'user') => {
    setIsStarting(true);
    setCameraError(null);
    stopStream();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not available in this browser. Use HTTPS or a modern browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to access the camera.';
      const hint = message.toLowerCase().includes('permission') || message.toLowerCase().includes('denied')
        ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
        : message;
      setCameraError(hint);
    } finally {
      setIsStarting(false);
    }
  }, [stopStream]);

  // Start/stop stream when modal opens, facing mode changes, or modal closes.
  useEffect(() => {
    if (cameraOpen) {
      startStream(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [cameraOpen, facingMode, startStream, stopStream]);

  const openCamera = () => {
    setCameraError(null);
    setCameraOpen(true);
  };

  const closeCamera = () => {
    setCameraOpen(false);
  };

  const snap = async () => {
    if (!videoRef.current || !streamRef.current) return;
    setIsSnapping(true);
    try {
      const dataUrl = frameToDataUrl(videoRef.current);
      if (!dataUrl) return;
      const position = await getCurrentPosition();
      const newPhoto: VehiclePhoto = {
        id: `photo-${generateId()}`,
        dataUrl,
        capturedAt: new Date().toISOString(),
        latitude: position?.coords.latitude,
        longitude: position?.coords.longitude,
        locationLabel: position
          ? `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
          : undefined,
      };
      onChange([...photos, newPhoto]);
    } finally {
      setIsSnapping(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const position = await getCurrentPosition();
      const uploaded: VehiclePhoto[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const raw = await readFileAsDataURL(file);
        const dataUrl = await downscaleImage(raw);
        uploaded.push({
          id: `photo-${generateId()}`,
          dataUrl,
          capturedAt: new Date(file.lastModified || Date.now()).toISOString(),
          latitude: position?.coords.latitude,
          longitude: position?.coords.longitude,
          locationLabel: position
            ? `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
            : undefined,
        });
      }
      if (uploaded.length > 0) onChange([...photos, ...uploaded]);
    } finally {
      setIsUploading(false);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Vehicle Photos</span>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload
          </button>
          <button
            type="button"
            onClick={openCamera}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Camera className="h-3.5 w-3.5" /> Capture
          </button>
        </div>
      </div>
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {photos.length === 0 ? (
        <div className="p-6 rounded-xl bg-[var(--bg-tertiary)] border border-dashed border-[var(--border-color)] text-center">
          <Camera className="h-6 w-6 mx-auto text-[var(--text-tertiary)] mb-2" />
          <p className="text-xs text-[var(--text-tertiary)]">
            Tap <span className="font-semibold text-red-500">Capture</span> to open the camera, or <span className="font-semibold text-[var(--text-secondary)]">Upload</span> existing photos.
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Each photo is stamped with time and GPS location.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative rounded-xl overflow-hidden border border-[var(--border-color)] group">
              <button
                type="button"
                onClick={() => setViewingPhoto(photo)}
                className="block w-full aspect-square cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.dataUrl} alt="vehicle" className="w-full h-full object-cover" />
              </button>
              <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none">
                <p className="text-[10px] text-white/90 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(photo.capturedAt).toLocaleString()}
                </p>
                {photo.locationLabel && (
                  <p className="text-[10px] text-white/80 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {photo.locationLabel}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                title="Remove"
                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 text-white/90 hover:bg-red-500/80 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Live camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-[70] bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 text-white">
            <div>
              <p className="text-sm font-semibold">Vehicle Camera</p>
              <p className="text-[11px] text-white/60">{photos.length} photo{photos.length === 1 ? '' : 's'} captured</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
                title="Switch camera"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={closeCamera}
                title="Close"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {cameraError ? (
              <div className="max-w-sm text-center p-6 text-white/90 space-y-3">
                <Camera className="h-8 w-8 mx-auto text-red-500" />
                <p className="text-sm font-semibold">Camera unavailable</p>
                <p className="text-xs text-white/70">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => startStream(facingMode)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="max-h-full max-w-full object-contain"
                />
                {isStarting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-5 flex items-center justify-center gap-6 bg-black/70">
            {/* Thumbnail of most recent capture as a quick confirmation */}
            {photos.length > 0 ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[photos.length - 1].dataUrl} alt="last" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12" />
            )}

            <button
              type="button"
              onClick={snap}
              disabled={isStarting || !!cameraError || isSnapping}
              title="Take photo"
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSnapping ? <Loader2 className="h-6 w-6 animate-spin" /> : <Aperture className="h-7 w-7" />}
            </button>

            <button
              type="button"
              onClick={closeCamera}
              className="px-4 py-2 rounded-xl border border-white/20 text-white text-xs font-semibold hover:bg-white/10 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Full-size preview of a saved photo */}
      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="max-w-3xl w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewingPhoto.dataUrl} alt="vehicle" className="w-full rounded-xl" />
            <div className="flex flex-wrap gap-4 text-xs text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {new Date(viewingPhoto.capturedAt).toLocaleString()}
              </span>
              {viewingPhoto.locationLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {viewingPhoto.locationLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
