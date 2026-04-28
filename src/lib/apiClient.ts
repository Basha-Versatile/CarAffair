async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });
  const ct = res.headers.get('content-type') ?? '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (body && typeof body === 'object' && 'error' in body && (body as { error?: string }).error) || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data?: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  put: <T>(url: string, data?: unknown) => request<T>(url, { method: 'PUT', body: JSON.stringify(data ?? {}) }),
  patch: <T>(url: string, data?: unknown) => request<T>(url, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
