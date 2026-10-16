// Thin wrapper around fetch that attaches the JWT auth token (if present)
// and normalizes auth errors. Use this for any protected/admin API call.

export const API_BASE = 'http://localhost:5000';

export function getToken() {
  return localStorage.getItem('jofiane-token');
}

export function clearToken() {
  localStorage.removeItem('jofiane-token');
}

/**
 * fetch() with the Authorization header added automatically.
 * On 401 (expired/invalid session) it clears the token and reloads to the
 * login screen. Returns the raw Response so callers can inspect status/body.
 */
export async function authFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Session gone — force a fresh login.
    clearToken();
    if (typeof window !== 'undefined') {
      alert('Your session has expired. Please log in again.');
      window.location.reload();
    }
  }
  return res;
}

// Convenience: parse the JSON error message from a failed response.
export async function readError(res, fallback) {
  const data = await res.json().catch(() => ({}));
  return data.error || fallback || `Server error: ${res.status}`;
}

// Password policy, kept in sync with the back-end:
// 5–8 chars, with an uppercase, a lowercase, a number, and a special character.
export const PASSWORD_RULE_TEXT =
  '5–8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.';

export function validatePassword(pw) {
  const s = String(pw || '');
  if (s.length < 5 || s.length > 8) return `Password must be ${PASSWORD_RULE_TEXT}`;
  if (!/[A-Z]/.test(s))         return `Password must be ${PASSWORD_RULE_TEXT}`;
  if (!/[a-z]/.test(s))         return `Password must be ${PASSWORD_RULE_TEXT}`;
  if (!/[0-9]/.test(s))         return `Password must be ${PASSWORD_RULE_TEXT}`;
  if (!/[^A-Za-z0-9]/.test(s))  return `Password must be ${PASSWORD_RULE_TEXT}`;
  return null;
}
