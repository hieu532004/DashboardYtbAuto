// lib/api.ts
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '');

const isBrowser = typeof window !== 'undefined';
// Nếu đang chạy trên domain *.vercel.app thì tự ép proxy, ngoài ra vẫn có thể bật bằng ENV
const onVercel = isBrowser && /\.vercel\.app$/i.test(window.location.hostname);
const forceProxy = process.env.NEXT_PUBLIC_FORCE_PROXY === '1' || onVercel;

export type ApiError = { status: number; body: string };

export function authHeaders(): Record<string, string> {
  if (!isBrowser) return {};
  const token = localStorage.getItem('admin_jwt'); // <-- KEY phải đúng
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function toJsonSafe<T>(res: Response): Promise<T> {
  // Một số API có thể trả plain text → thử JSON rồi fallback text
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  const txt = await res.text();
  try { return JSON.parse(txt) as T; } catch { return { } as T; }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw { status: res.status, body } as ApiError;
  }
  return toJsonSafe<T>(res);
}

function makeUrl(path: string) {
  const p = path.startsWith('/') ? path : '/' + path;
  if (forceProxy) return `/api-proxy${p}`;       // Vercel/Prod: same-origin proxy
  return `${API_BASE}${p}`;                      // Local hoặc có domain HTTPS hợp lệ
}

// === helpers ===
export function resolveApiUrl(path: string) { return makeUrl(path); }

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(makeUrl(path), {
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
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
