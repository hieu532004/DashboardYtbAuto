export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '');
const isDev = process.env.NODE_ENV === 'development';

export type ApiError = { status: number; body: string };

export function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('admin_jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw { status: res.status, body } as ApiError;
  }
  return (await res.json()) as T;
}

function makeUrl(path: string) {
  const p = path.startsWith('/') ? path : '/' + path;
  // DEV: gọi qua proxy cùng origin để né TLS/CORS
  if (isDev) return `/api-proxy${p}`;
  // PROD: gọi thẳng API
  return `${API_BASE}${p}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(makeUrl(path), { headers: { ...authHeaders() } });
  return handle<T>(res);
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(makeUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res);
}
