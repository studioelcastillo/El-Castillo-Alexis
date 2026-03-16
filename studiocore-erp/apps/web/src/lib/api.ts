import type { AuthSessionResponse, HealthResponse, MeResponse } from '@studiocore/contracts';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4102/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function resolveApiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function applyBranchHeader(headers: Headers, activeBranchId?: number | null) {
  if (activeBranchId !== null && activeBranchId !== undefined) {
    headers.set('X-Branch-Id', String(activeBranchId));
  }
}

function extractErrorMessage(payload: unknown, fallbackStatusText: string) {
  if (!payload) {
    return fallbackStatusText || 'Request failed';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload === 'object') {
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  return fallbackStatusText || 'Request failed';
}

export async function requestJson<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(resolveApiUrl(path), {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(payload, response.statusText), response.status, payload);
  }

  return payload as T;
}

export function authenticatedRequest<T>(path: string, accessToken: string, activeBranchId?: number | null, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  applyBranchHeader(headers, activeBranchId);
  return requestJson<T>(path, {
    ...init,
    headers,
  });
}

export function loginRequest(email: string, password: string, branchId?: number | null) {
  return requestJson<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      ...(branchId !== undefined ? { branchId } : {}),
    }),
  });
}

export function refreshRequest(refreshToken: string, branchId?: number | null) {
  return requestJson<AuthSessionResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken, ...(branchId !== undefined ? { branchId } : {}) }),
  });
}

export function logoutRequest(refreshToken: string) {
  return requestJson<{ success: boolean }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function meRequest(accessToken: string, activeBranchId?: number | null) {
  return authenticatedRequest<MeResponse>('/auth/me', accessToken, activeBranchId);
}

export function healthRequest() {
  return requestJson<HealthResponse>('/health');
}

export function apiBaseUrl() {
  return API_BASE_URL;
}
