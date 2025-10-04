export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '');

const isBrowser = typeof window !== 'undefined';
// Tự nhận diện đang chạy trên domain *.vercel.app
const onVercelDomain = isBrowser && /\.vercel\.app$/i.test(window.location.hostname);

// Ưu tiên: env bật proxy, hoặc tự bật nếu đang trên Vercel domain
const forceProxy =
  process.env.NEXT_PUBLIC_FORCE_PROXY === '1' ||
  onVercelDomain;

export type ApiError = { status: number; body: string };

export function authHeaders(): Record<string, string> {
  if (!isBrowser) return {};
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
  // Trên Vercel hoặc khi bật cờ: ép đi proxy same-origin
  if (forceProxy) return `/api-proxy${p}`;
  // Còn lại: gọi thẳng API_BASE (ví dụ local dev, hoặc đã có domain + cert hợp lệ)
  return `${API_BASE}${p}`;
}

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
