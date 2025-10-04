// app/api-proxy/[...path]/route.ts
export const runtime = 'nodejs'; // BẮT BUỘC: chạy Node, không dùng Edge

import { NextRequest } from 'next/server';
import { Agent, type Dispatcher } from 'undici';

// Upstream IP (http/https), ví dụ: https://103.157.204.199
const BASE = (process.env.API_UPSTREAM ?? '').replace(/\/$/, '');
// Nếu upstream là HTTPS IP self-signed, bật cờ này để bỏ kiểm TLS ở server-side
const insecureTLS = process.env.API_INSECURE_TLS === '1';
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });

function sanitizeHeaders(h: Headers) {
  const out = new Headers(h);
  // Các header nên bỏ khi forward
  out.delete('host');
  out.delete('connection');
  out.delete('content-length');
  out.delete('accept-encoding'); // tránh compressed stream issues
  return out;
}

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  if (!BASE) return new Response('Missing API_UPSTREAM', { status: 500 });

  const target = `${BASE}/${params.path.join('/')}${req.nextUrl.search}`;

  const init: (RequestInit & { dispatcher?: Dispatcher }) = {
    method: req.method,
    headers: sanitizeHeaders(req.headers),
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    cache: 'no-store',
    redirect: 'follow',
    dispatcher: insecureTLS ? insecureAgent : undefined, // chỉ dùng khi cần bỏ kiểm TLS
  };

  const res = await fetch(target, init);

  // Dọn dẹp header trả về
  const headers = new Headers(res.headers);
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');

  return new Response(res.body, { status: res.status, headers });
}

// Export cho mọi method
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS }
