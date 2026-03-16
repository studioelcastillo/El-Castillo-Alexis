import type { AuthSessionResponse } from '@studiocore/contracts';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import {
  ApiError,
  authenticatedRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
} from './api';

const STORAGE_KEY = 'studiocore.web.session';

type AuthContextValue = {
  ready: boolean;
  session: AuthSessionResponse | null;
  login: (email: string, password: string, branchId?: number | null) => Promise<void>;
  logout: () => Promise<void>;
  switchBranch: (branchId: number | null) => Promise<void>;
  setSession: (session: AuthSessionResponse | null) => void;
  clearSession: () => void;
  hasPermission: (permission?: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSessionResponse;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistSession(session: AuthSessionResponse | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [session, setSessionState] = useState<AuthSessionResponse | null>(null);

  const setSession = useCallback((nextSession: AuthSessionResponse | null) => {
    setSessionState(nextSession);
    persistSession(nextSession);
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
  }, [setSession]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = readStoredSession();
      if (!stored) {
        if (!cancelled) {
          setReady(true);
        }
        return;
      }

      try {
        const { user } = await meRequest(stored.tokens.accessToken, stored.user.activeBranchId);
        if (!cancelled) {
          setSession({ ...stored, user });
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          try {
            const refreshed = await refreshRequest(stored.tokens.refreshToken, stored.user.activeBranchId);
            if (!cancelled) {
              setSession(refreshed);
            }
          } catch {
            if (!cancelled) {
              clearSession();
            }
          }
        } else if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [clearSession, setSession]);

  const login = useCallback(
    async (email: string, password: string, branchId?: number | null) => {
      const nextSession = await loginRequest(email, password, branchId);
      setSession(nextSession);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    const refreshToken = session?.tokens.refreshToken;

    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } finally {
      clearSession();
    }
  }, [clearSession, session?.tokens.refreshToken]);

  const switchBranch = useCallback(
    async (branchId: number | null) => {
      if (!session) {
        throw new ApiError('Debes iniciar sesion para continuar.', 401);
      }

      try {
        const refreshed = await refreshRequest(session.tokens.refreshToken, branchId);
        setSession(refreshed);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
        }

        throw error;
      }
    },
    [clearSession, session, setSession],
  );

  const hasPermission = useCallback(
    (permission?: string) => {
      if (!permission) {
        return true;
      }

      return session?.user.permissions.includes(permission) ?? false;
    },
    [session?.user.permissions],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ ready, session, login, logout, switchBranch, setSession, clearSession, hasPermission }),
    [clearSession, hasPermission, login, logout, ready, session, setSession, switchBranch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useApiClient() {
  const { session, setSession, clearSession } = useAuth();

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      if (!session) {
        throw new ApiError('Debes iniciar sesion para continuar.', 401);
      }

      try {
        return await authenticatedRequest<T>(
          path,
          session.tokens.accessToken,
          session.user.activeBranchId,
          init,
        );
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        try {
          const refreshed = await refreshRequest(session.tokens.refreshToken, session.user.activeBranchId);
          setSession(refreshed);
          return await authenticatedRequest<T>(
            path,
            refreshed.tokens.accessToken,
            refreshed.user.activeBranchId,
            init,
          );
        } catch (refreshError) {
          clearSession();
          throw refreshError;
        }
      }
    },
    [clearSession, session, setSession],
  );

  const get = useCallback(
    <T,>(path: string) => request<T>(path),
    [request],
  );

  const post = useCallback(
    <T,>(path: string, body: unknown) =>
      request<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    [request],
  );

  const patch = useCallback(
    <T,>(path: string, body: unknown) =>
      request<T>(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    [request],
  );

  const put = useCallback(
    <T,>(path: string, body: unknown) =>
      request<T>(path, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    [request],
  );

  const del = useCallback(
    <T,>(path: string) =>
      request<T>(path, {
        method: 'DELETE',
      }),
    [request],
  );

  return { request, get, post, patch, put, delete: del };
}
