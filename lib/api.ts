// lib/api.ts
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '');

const isBrowser = typeof window !== 'undefined';
const onVercelDomain = isBrowser && /\.vercel\.app$/i.test(window.location.hostname);

// ép dùng proxy khi bật ENV, chạy trên Vercel, hoặc không có API_BASE
const forceProxy =
  process.env.NEXT_PUBLIC_FORCE_PROXY === '1' ||
  process.env.VERCEL === '1' ||
  (!API_BASE && (onVercelDomain || process.env.VERCEL === '1'));

export type ApiError = { status: number; body: string };

export function getToken() {
  if (!isBrowser) return null;
  return localStorage.getItem('admin_jwt');
}

export function authHeaders(): Record<string, string> {
  if (!isBrowser) return {};
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function resolveApiUrl(path: string) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (forceProxy || !API_BASE) return `/api-proxy${clean}`;
  return `${API_BASE}${clean}`;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch {}
    throw { status: res.status, body } as ApiError;
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(resolveApiUrl(path), {
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  return handle<T>(res);
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(resolveApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  return handle<T>(res);
}
