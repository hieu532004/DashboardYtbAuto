// app/api-proxy/[...path]/route.ts
export const runtime = 'nodejs';           // dùng Node runtime
export const dynamic = 'force-dynamic';    // không cache

import { NextRequest } from 'next/server';
import { Agent, type Dispatcher } from 'undici';

// Upstream API của bạn: https://103.157.204.199 hoặc http://103.157.204.199:8080
const BASE = (process.env.API_UPSTREAM ?? '').replace(/\/$/, '');
const insecureTLS = process.env.API_INSECURE_TLS === '1'; // bỏ kiểm TLS khi cert IP không hợp lệ
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });

function cleanHeaders(h: Headers) {
  const out = new Headers(h);
  out.delete('host');
  out.delete('connection');
  out.delete('content-length');
  out.delete('accept-encoding');
  return out;
}

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  if (!BASE) return new Response('Missing API_UPSTREAM', { status: 500 });

  const target = `${BASE}/${params.path.join('/')}${req.nextUrl.search}`;
  const init: (RequestInit & { dispatcher?: Dispatcher }) = {
    method: req.method,
    headers: cleanHeaders(req.headers),
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    cache: 'no-store',
    redirect: 'follow',
    dispatcher: insecureTLS ? insecureAgent : undefined, // chỉ set khi cần bỏ TLS
  };

  const res = await fetch(target, init);

  const headers = new Headers(res.headers);
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');

  return new Response(res.body, { status: res.status, headers });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };
