const API_BASE = 'http://localhost:4000/api';

export function getAuthToken() {
  return localStorage.getItem('learnpath-token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('learnpath-token', token);
    return;
  }

  localStorage.removeItem('learnpath-token');
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload as T;
}

export async function uploadFiles(files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Upload failed');
  }

  return payload;
}
