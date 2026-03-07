import type { AxiosResponse } from 'axios';

const getFileNameFromDisposition = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(value);
  const raw = match?.[1] || match?.[2];
  if (!raw) return fallback;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const downloadFromResponse = (response: AxiosResponse<Blob>, fallbackName: string) => {
  const disposition = response.headers?.['content-disposition'] as string | undefined;
  const fileName = getFileNameFromDisposition(disposition, fallbackName);
  downloadBlob(response.data, fileName);
};

export { getFileNameFromDisposition, downloadBlob, downloadFromResponse };
