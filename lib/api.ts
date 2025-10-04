// lib/api.ts
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '');

const isBrowser = typeof window !== 'undefined';
const onVercelDomain = isBrowser && /\.vercel\.app$/i.test(window.location.hostname);

// Ép proxy nếu: bật ENV, hoặc build đang chạy trên Vercel, hoặc không có API_BASE
const forceProxy =
  process.env.NEXT_PUBLIC_FORCE_PROXY === '1' ||
  process.env.VERCEL === '1' ||
  (!API_BASE && (onVercelDomain || process.env.VERCEL === '1'));

export type ApiError = { status: number; body: string };

export function authHeaders(): Record<string, string> {
  if (!isBrowser) return {};
  const token = localStorage.getItem('admin_jwt'); // KEY token
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw { status: res.status, body } as ApiError;
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  try { return JSON.parse(await res.text()) as T; } catch { return {} as T; }
}

function makeUrl(path: string) {
  const p = path.startsWith('/') ? path : '/' + path;
  if (forceProxy) return `/api-proxy${p}`;     // luôn đi proxy trên Vercel
  if (API_BASE)   return `${API_BASE}${p}`;    // dev local hoặc đã có domain HTTPS hợp lệ
  return `/api-proxy${p}`;                     // fallback an toàn
}

export const resolveApiUrl = makeUrl;          // tiện debug UI

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
