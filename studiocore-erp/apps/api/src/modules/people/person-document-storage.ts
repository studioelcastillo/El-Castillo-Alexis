export type PersonDocumentStorageState = 'managed' | 'external' | 'unavailable';

type DocumentStorageShape = {
  storageBucket?: string | null;
  storagePath?: string | null;
  publicUrl?: string | null;
};

type BuildStoragePathInput = {
  companyId: number;
  personId: number;
  documentId?: number | null;
  label?: string | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  now?: Date;
};

export function resolvePersonDocumentStorageState(document: DocumentStorageShape): PersonDocumentStorageState {
  if (document.storageBucket && document.storagePath) {
    return 'managed';
  }

  if (document.publicUrl) {
    return 'external';
  }

  return 'unavailable';
}

export function buildPersonDocumentStoragePath(input: BuildStoragePathInput) {
  const extension = extractDocumentFileExtension(input.originalFileName, input.mimeType);
  const label = slugifyDocumentLabel(input.label || 'document') || 'document';
  const timestamp = (input.now || new Date()).toISOString().replace(/[:.]/g, '-');
  const documentPrefix = input.documentId ? `${input.documentId}-` : '';
  return `images/models/documents/${input.companyId}/${input.personId}/${timestamp}-${documentPrefix}${label}.${extension}`;
}

export function extractDocumentFileExtension(fileName?: string | null, mimeType?: string | null) {
  const normalizedFileName = fileName?.trim();
  const fileParts = normalizedFileName?.split('.').filter(Boolean) ?? [];
  if (fileParts.length > 1) {
    const fromName = fileParts[fileParts.length - 1]?.toLowerCase();
    if (fromName) {
      return fromName;
    }
  }

  if (!mimeType) {
    return 'bin';
  }

  const normalizedMimeType = mimeType.toLowerCase().split(';')[0].trim();
  if (normalizedMimeType === 'image/jpeg') return 'jpg';
  if (normalizedMimeType === 'image/png') return 'png';
  if (normalizedMimeType === 'application/pdf') return 'pdf';
  if (normalizedMimeType === 'image/webp') return 'webp';
  if (normalizedMimeType === 'video/mp4') return 'mp4';
  return normalizedMimeType.split('/').pop() || 'bin';
}

export function extractDocumentFileNameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const fileName = parsed.pathname.split('/').filter(Boolean).pop();
    return fileName ? decodeURIComponent(fileName) : null;
  } catch {
    return null;
  }
}

export function mergeDocumentNotes(current: string | null | undefined, nextLine: string) {
  const lines = [current?.trim(), nextLine.trim()].filter((value): value is string => Boolean(value));
  return lines.join('\n') || null;
}

function slugifyDocumentLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
