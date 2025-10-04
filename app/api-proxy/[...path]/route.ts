// app/api-proxy/api/[...path]/route.ts
import { NextRequest } from 'next/server';
import { Agent, setGlobalDispatcher } from 'undici';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Upstream base URL (không slash ở cuối)
const upstreamBase = (process.env.API_UPSTREAM || process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
const insecure = process.env.API_INSECURE_TLS === '1';

// Nếu cần bỏ qua chứng chỉ tự ký, đặt global dispatcher 1 lần ở cấp module.
if (insecure) {
  try {
    setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }));
  } catch {
    // ignore: trên một số môi trường đã có dispatcher
  }
}

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  if (!upstreamBase) {
    return new Response('Missing API_UPSTREAM / NEXT_PUBLIC_API_BASE', { status: 500 });
  }

  const tail = Array.isArray(params?.path) ? params.path.join('/') : '';
  const target = `${upstreamBase}/${tail}${req.nextUrl.search}`;

  // Sao chép header, loại bỏ những header không hợp lệ khi forward
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');

  // Body chỉ dùng cho các phương thức có payload
  const body = (req.method === 'GET' || req.method === 'HEAD') ? undefined : await req.arrayBuffer();

  // Gọi upstream (không dùng dispatcher trong RequestInit để tránh TS lỗi)
  const res = await fetch(target, {
    method: req.method,
    headers,
    body,
    cache: 'no-store',
    redirect: 'manual',
  });

  // Trả passthrough response
  const respHeaders = new Headers(res.headers);
  // (Tuỳ chọn) nới CORS trong dev
  respHeaders.set('access-control-allow-origin', '*');

  return new Response(res.body, { status: res.status, headers: respHeaders });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };
