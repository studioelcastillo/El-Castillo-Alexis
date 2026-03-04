
import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload, Trash2, X, Loader2, Play, Image as ImageIcon, Plus, Eye, RefreshCw, Video
} from 'lucide-react';
import DocumentService from '../DocumentService';

// ==================== TYPES ====================

interface MultimediaSectionProps {
  userId: number;
}

interface VideoItem {
  doc_id: number;
  doc_url: string;
  doc_label?: string;
  created_at?: string;
}

interface ImageItem {
  doc_id: number;
  doc_url: string;
  doc_label?: string;
  created_at?: string;
}

// ==================== MAIN COMPONENT ====================

const MultimediaSection: React.FC<MultimediaSectionProps> = ({ userId }) => {
  // Videos
  const [videos, setVideos] = useState<Record<string, VideoItem[]>>({});
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Images
  const [images, setImages] = useState<Record<string, ImageItem[]>>({});
  const [loadingImages, setLoadingImages] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // General
  const [error, setError] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);

  // ============ LOAD ============
  const loadVideos = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const res = await DocumentService.getUserVideos(userId);
      setVideos(res.data?.data || {});
    } catch (err) {
      console.error('Error cargando videos:', err);
    } finally { setLoadingVideos(false); }
  }, [userId]);

  const loadImages = useCallback(async () => {
    setLoadingImages(true);
    try {
      const res = await DocumentService.getUserImagesMultimedia(userId);
      setImages(res.data?.data || {});
    } catch (err) {
      console.error('Error cargando imágenes:', err);
    } finally { setLoadingImages(false); }
  }, [userId]);

  useEffect(() => { loadVideos(); loadImages(); }, [loadVideos, loadImages]);

  // ============ UPLOAD VIDEO ============
  const handleUploadVideo = async (file: File) => {
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) { setError('El video es demasiado pesado (máx 8MB)'); return; }
    setUploadingVideo(true); setError(null);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('user_id', String(userId));
      await DocumentService.uploadVideo(formData);
      loadVideos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al subir video');
    } finally { setUploadingVideo(false); }
  };

  // ============ UPLOAD IMAGE ============
  const handleUploadImage = async (file: File) => {
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) { setError('La imagen es demasiado pesada (máx 8MB)'); return; }
    setUploadingImage(true); setError(null);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('user_id', String(userId));
      await DocumentService.uploadImageMultimedia(formData);
      loadImages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al subir imagen');
    } finally { setUploadingImage(false); }
  };

  // ============ DELETE ============
  const handleDeleteVideo = async (docId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este video?')) return;
    try {
      await DocumentService.deleteDocument(docId, 'video');
      loadVideos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar video');
    }
  };

  const handleDeleteImage = async (docId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta imagen?')) return;
    try {
      await DocumentService.deleteDocument(docId, 'image_multimedia');
      loadImages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar imagen');
    }
  };

  // ============ HELPERS ============
  const fileUrl = (path: string) => DocumentService.getFileUrl(path);

  const flatVideos = Object.entries(videos).flatMap(([group, items]) =>
    items.map(v => ({ ...v, group }))
  );
  const flatImages = Object.entries(images).flatMap(([group, items]) =>
    items.map(img => ({ ...img, group }))
  );

  return (
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700"><X size={14} /></button>
        </div>
      )}

      {/* ======================== VIDEOS ======================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Video size={12} /> Videos de presentación
            <span className="text-slate-300 font-normal">({flatVideos.length})</span>
          </h4>
          <div className="flex items-center gap-1">
            <button onClick={loadVideos} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="Recargar">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Upload video button */}
        <div className="flex flex-wrap gap-3">
          {/* Upload trigger */}
          <label className="relative flex flex-col items-center justify-center w-32 h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all group">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadVideo(f); e.target.value = ''; }}
              disabled={uploadingVideo}
            />
            {uploadingVideo ? (
              <Loader2 size={20} className="animate-spin text-amber-500" />
            ) : (
              <>
                <Plus size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span className="text-[9px] font-bold text-slate-400 group-hover:text-amber-600 mt-1">Subir video</span>
              </>
            )}
          </label>

          {/* Videos list */}
          {loadingVideos ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
              <Loader2 size={14} className="animate-spin" /> Cargando...
            </div>
          ) : flatVideos.length === 0 ? (
            <div className="flex items-center gap-2 text-slate-300 text-xs py-4">
              Sin videos cargados
            </div>
          ) : (
            flatVideos.map(v => (
              <div key={v.doc_id} className="relative group w-32 h-24 bg-black rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <video
                  src={fileUrl(`/uploads/videos/${v.doc_url}`)}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                {/* Play overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer hover:bg-black/50 transition-colors"
                  onClick={() => setPreviewMedia({ type: 'video', url: fileUrl(`/uploads/videos/${v.doc_url}`) })}
                >
                  <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <Play size={14} className="text-slate-700 ml-0.5" />
                  </div>
                </div>
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteVideo(v.doc_id)}
                  className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Eliminar"
                >
                  <Trash2 size={10} />
                </button>
                {/* Group badge */}
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-bold rounded">
                  {v.group}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ======================== IMAGES ======================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon size={12} /> Galería de Fotos
            <span className="text-slate-300 font-normal">({flatImages.length})</span>
          </h4>
          <div className="flex items-center gap-1">
            <button onClick={loadImages} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="Recargar">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Upload trigger */}
          <label className="relative flex flex-col items-center justify-center w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImage(f); e.target.value = ''; }}
              disabled={uploadingImage}
            />
            {uploadingImage ? (
              <Loader2 size={20} className="animate-spin text-amber-500" />
            ) : (
              <>
                <Plus size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span className="text-[9px] font-bold text-slate-400 group-hover:text-amber-600 mt-1">Subir foto</span>
              </>
            )}
          </label>

          {/* Images list */}
          {loadingImages ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
              <Loader2 size={14} className="animate-spin" /> Cargando...
            </div>
          ) : flatImages.length === 0 ? (
            <div className="flex items-center gap-2 text-slate-300 text-xs py-4">
              Sin fotos cargadas
            </div>
          ) : (
            flatImages.map(img => (
              <div key={img.doc_id} className="relative group w-24 h-24 bg-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <img
                  src={fileUrl(`/uploads/images/${img.doc_url}`)}
                  alt={img.doc_label || 'Foto'}
                  className="w-full h-full object-cover"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setPreviewMedia({ type: 'image', url: fileUrl(`/uploads/images/${img.doc_url}`) })}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors shadow-lg"
                    title="Ver"
                  >
                    <Eye size={12} className="text-slate-700" />
                  </button>
                  <button
                    onClick={() => handleDeleteImage(img.doc_id)}
                    className="p-1.5 bg-red-500/90 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                    title="Eliminar"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                </div>
                {/* Group badge */}
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-bold rounded">
                  {img.group}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ======================== LIGHTBOX ======================== */}
      {previewMedia && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setPreviewMedia(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative max-w-4xl max-h-[90vh] w-full animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full shadow-xl text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X size={18} />
            </button>
            {previewMedia.type === 'video' ? (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-xl shadow-2xl mx-auto"
                controlsList="nodownload"
              />
            ) : (
              <img
                src={previewMedia.url}
                alt="Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl mx-auto"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultimediaSection;
