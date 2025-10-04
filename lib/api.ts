export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '');
const forceProxy = process.env.NEXT_PUBLIC_FORCE_PROXY === '1'; // bật trên Vercel

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
  // tuỳ API: thường là JSON
  return (await res.json()) as T;
}

function makeUrl(path: string) {
  const p = path.startsWith('/') ? path : '/' + path;
  // Trên Vercel/Prod: ép đi qua proxy (same-origin) để né TLS/CORS với IP trần
  if (forceProxy) return `/api-proxy${p}`;
  // Local dev (tuỳ bạn muốn), hoặc khi đã có domain/cert hợp lệ:
  return `${API_BASE}${p}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(makeUrl(path), { headers: { ...authHeaders() }, cache: 'no-store' });
  return handle<T>(res);
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(makeUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  return handle<T>(res);
}
