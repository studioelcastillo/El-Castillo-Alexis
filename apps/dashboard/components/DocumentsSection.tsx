
import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload, Trash2, X, Loader2, AlertCircle, Camera, Eye, RefreshCw
} from 'lucide-react';
import DocumentService, { DOC_LABELS, DOC_LABEL_NAMES } from '../DocumentService';

// ==================== TYPES ====================

interface DocumentsSectionProps {
  userId: number;
  userName?: string;
}

interface DocSlot {
  label: string;        // IMG_ID_FRONT, etc.
  displayName: string;  // Identificación Frente, etc.
  doc_id: number | null;
  img_url: string;      // full URL or empty
  uploading: boolean;
}

// ==================== MAIN COMPONENT ====================

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ userId, userName }) => {
  const [slots, setSlots] = useState<DocSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Build initial slots from latest_documents array
  const buildSlots = useCallback((existingDocs: any[] = []): DocSlot[] => {
    // Filter only doc_type === 'image' documents (not videos or multimedia)
    const imageDocs = existingDocs.filter((d: any) => d.doc_type === 'image');
    return DOC_LABELS.map(label => {
      const existing = imageDocs.find((d: any) => d.doc_label === label);
      return {
        label,
        displayName: DOC_LABEL_NAMES[label] || label,
        doc_id: existing?.doc_id || null,
        img_url: existing?.doc_url
          ? DocumentService.getFileUrl(`/images/models/documents/${existing.doc_url}`)
          : '',
        uploading: false,
      };
    });
  }, []);

  // Load existing documents from user's latest_documents
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const userRes = await import('../UserService').then(m => m.default.getUser(userId));
      const userData = userRes.data?.data?.[0] || userRes.data?.data || {};

      // Backend returns documents in 'latest_documents' (relation in User model)
      const docs = userData.latest_documents || [];
      setSlots(buildSlots(docs));
    } catch (err) {
      console.error('Error loading documents:', err);
      setSlots(buildSlots());
    } finally {
      setLoading(false);
    }
  }, [userId, buildSlots]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  // Handle file upload for a specific slot
  const handleUpload = async (slotIndex: number, file: File) => {
    const maxSize = 8 * 1024 * 1024; // 8MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado pesado (máx 8MB)');
      return;
    }

    // Mark slot as uploading
    setSlots(prev => prev.map((s, i) => i === slotIndex ? { ...s, uploading: true } : s));
    setError(null);

    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('doc_label', slots[slotIndex].label);
      formData.append('user_id', String(userId));

      // If replacing an existing document, include its ID
      if (slots[slotIndex].doc_id) {
        formData.append('doc_id', String(slots[slotIndex].doc_id));
      }

      const res = await DocumentService.uploadImage(formData);
      const newDocId = res.data?.data;

      // Update slot with new data
      setSlots(prev => prev.map((s, i) =>
        i === slotIndex
          ? { ...s, doc_id: newDocId || s.doc_id, img_url: URL.createObjectURL(file), uploading: false }
          : s
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al subir el documento');
      setSlots(prev => prev.map((s, i) => i === slotIndex ? { ...s, uploading: false } : s));
    }
  };

  // Handle delete
  const handleDelete = async (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (!slot.doc_id) return;
    if (!window.confirm(`¿Eliminar ${slot.displayName}?`)) return;

    try {
      const res = await DocumentService.deleteDocument(slot.doc_id, 'document');
      if (res.data?.status === 'fail') {
        // Backend returns fail when the physical file doesn't exist on disk
        // Clear the slot anyway since the image is already gone
        setSlots(prev => prev.map((s, i) =>
          i === slotIndex ? { ...s, doc_id: null, img_url: '' } : s
        ));
        setError('Archivo no encontrado en el servidor. Se limpió la referencia local.');
        return;
      }
      setSlots(prev => prev.map((s, i) =>
        i === slotIndex ? { ...s, doc_id: null, img_url: '' } : s
      ));
    } catch (err: any) {
      // Even on error, clear the slot visually if the file is unreachable
      setSlots(prev => prev.map((s, i) =>
        i === slotIndex ? { ...s, doc_id: null, img_url: '' } : s
      ));
      setError(err.response?.data?.message || 'El archivo no existe en el servidor. Se limpió la referencia.');
    }
  };

  // Trigger hidden file input
  const triggerFileInput = (slotIndex: number) => {
    const input = document.getElementById(`doc-input-${slotIndex}`) as HTMLInputElement;
    if (input) input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
        <Loader2 size={16} className="animate-spin" /> Cargando documentos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700"><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {userName || 'Modelo'} — Documentos de identidad
        </p>
        <button onClick={loadDocuments} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="Recargar">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((slot, index) => (
          <div key={slot.label} className="group relative bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all overflow-visible">
            {/* Hidden file input */}
            <input
              id={`doc-input-${index}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleUpload(index, f);
                e.target.value = '';
              }}
            />

            {/* Label */}
            <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider truncate">{slot.displayName}</span>
              {slot.doc_id && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Documento cargado" />
              )}
            </div>

            {/* Image area */}
            <div
              className="relative aspect-[3/4] flex items-center justify-center cursor-pointer bg-slate-100 rounded-b-xl overflow-hidden"
              onClick={() => {
                if (slot.img_url) setPreviewUrl(slot.img_url);
                else triggerFileInput(index);
              }}
            >
              {slot.uploading ? (
                <div className="flex flex-col items-center gap-2 text-amber-500">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-[10px] font-bold">Subiendo...</span>
                </div>
              ) : slot.img_url ? (
                <img
                  src={slot.img_url}
                  alt={slot.displayName}
                  className="w-full h-full object-contain"
                  onError={e => { (e.target as HTMLImageElement).src = ''; }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <Camera size={28} />
                  <span className="text-[10px] font-bold">Click para subir</span>
                </div>
              )}

              {/* Hover overlay */}
              {!slot.uploading && (
                <div className="absolute inset-0 rounded-b-xl bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={e => { e.stopPropagation(); triggerFileInput(index); }}
                    className="p-2.5 bg-white/95 text-slate-700 rounded-full hover:bg-white transition-colors shadow-lg"
                    title={slot.img_url ? 'Cambiar' : 'Subir'}
                  >
                    <Upload size={14} />
                  </button>
                  {slot.img_url && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); setPreviewUrl(slot.img_url); }}
                        className="p-2.5 bg-white/95 text-slate-700 rounded-full hover:bg-white transition-colors shadow-lg"
                        title="Ver"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(index); }}
                        className="p-2.5 bg-red-500/95 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Preview */}
      {previewUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full shadow-xl text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X size={18} />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsSection;
