
import { api } from './api';

// ==================== TYPES ====================

export interface DocumentItem {
  doc_id: number;
  doc_url: string;
  doc_label: string;
  doc_type: string;
  user_id: number;
  created_at?: string;
}

// Document label constants matching legacy
export const DOC_LABELS = [
  'IMG_ID_FRONT',
  'IMG_ID_BACK',
  'IMG_ID_HAND',
  'IMG_ID_FRONTBACK',
  'IMG_PROFILE',
  'IMG_OTHER',
] as const;

export const DOC_LABEL_NAMES: Record<string, string> = {
  IMG_ID_FRONT: 'Identificación Frente',
  IMG_ID_BACK: 'Identificación Reverso',
  IMG_ID_HAND: 'Identificación en Mano',
  IMG_ID_FRONTBACK: 'Identificación Frente y Reverso',
  IMG_PROFILE: 'Foto Perfil',
  IMG_OTHER: 'Otro Documento / Foto con Fecha',
};

// ==================== SERVICE ====================

const DocumentService = {
  // --- Upload document image (cedula, contrato, etc.) ---
  uploadImage: (formData: FormData) => {
    return api.post('/document/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // --- Upload video ---
  uploadVideo: (formData: FormData) => {
    return api.post('/document/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // --- Upload multimedia image ---
  uploadImageMultimedia: (formData: FormData) => {
    return api.post('/document/image_multimedia', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // --- Get user videos ---
  getUserVideos: (userId: number | string) => {
    return api.get(`/document/videos?user_id=${userId}`);
  },

  // --- Get user multimedia images ---
  getUserImagesMultimedia: (userId: number | string) => {
    return api.get(`/document/images_multimedia?user_id=${userId}`);
  },

  // --- Get user profile picture ---
  getUserProfilePicture: (userId: number | string) => {
    return api.get(`/document/profile_picture?user_id=${userId}`);
  },

  // --- Delete document/video/image ---
  deleteDocument: (docId: number | string, type: string) => {
    return api.delete(`/document/${docId}/${type}`);
  },

  // --- Helper: build base URL for serving files ---
  getFileUrl: (path: string): string => {
    // Remove /api from baseURL to get the server root
    const baseUrl = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
    return `${baseUrl}${path}`;
  },
};

export default DocumentService;
