import CryptoJS from "crypto-js";

/**
 * Encryption key derived from environment variable VITE_SESSION_KEY.
 * Falls back to a random key stored in sessionStorage (per-tab only).
 * NEVER hardcode this value in source code.
 */
const getStorage = () => {
  if (typeof window === "undefined") return null;
  const storageType = String(import.meta.env.VITE_SESSION_STORAGE || "session").toLowerCase();
  return storageType === "session" ? window.sessionStorage : window.localStorage;
};

const passEncrypt = (): string => {
  const envKey = import.meta.env.VITE_SESSION_KEY;
  if (envKey) return envKey;
  if (typeof window === "undefined") return "";

  // Fallback: per-session random key (not persistent across tabs, but better than hardcoded)
  let sessionKey = window.sessionStorage.getItem("_sk");
  if (!sessionKey) {
    sessionKey = CryptoJS.lib.WordArray.random(32).toString();
    window.sessionStorage.setItem("_sk", sessionKey);
  }
  return sessionKey;
};

const hasJsonStructure = (value: string) => {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value);
    return (
      Object.prototype.toString.call(parsed) === "[object Object]" ||
      Array.isArray(parsed)
    );
  } catch (error) {
    return false;
  }
};

const tryParse = (value: string) => {
  if (!value) return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const encryptSession = (key: string, data: unknown) => {
  const storage = getStorage();
  if (!storage) return;
  const payload =
    typeof data === "string" || typeof data === "number"
      ? String(data)
      : JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(payload, passEncrypt()).toString();
  storage.setItem(key, encrypted);
};

const decryptSession = (key: string) => {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return raw;

  try {
    const bytes = CryptoJS.AES.decrypt(raw, passEncrypt());
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      return tryParse(raw);
    }

    if (hasJsonStructure(decrypted)) {
      return JSON.parse(decrypted);
    }

    return decrypted;
  } catch (error) {
    return tryParse(raw);
  }
};

const clearSessionKeys = (keys: string[]) => {
  if (typeof window === "undefined") return;
  const primary = getStorage();
  const secondary = primary === window.localStorage ? window.sessionStorage : window.localStorage;
  keys.forEach((key) => {
    primary?.removeItem(key);
    secondary?.removeItem(key);
  });
};

const clearAuthSession = () => {
  clearSessionKeys(["user", "dashboard_user", "token"]);
};

export { encryptSession, decryptSession, clearSessionKeys, clearAuthSession };
