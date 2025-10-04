// Chạy ở Node runtime (không phải Edge)
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { Agent, type Dispatcher } from 'undici';

const BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/$/, '');

// DEV only: bỏ kiểm TLS cho cert self-signed của https://103.157.204.199
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });

async function forward(req: NextRequest, { params }: { params: { path: string[] } }) {
  const target = `${BASE}/${params.path.join('/')}${req.nextUrl.search}`;

  // copy header (trừ host)
  const headers = new Headers(req.headers);
  headers.delete('host');

  // dùng intersection type để hợp thức hoá 'dispatcher'
  const init: (RequestInit & { dispatcher?: Dispatcher }) = {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    // chỉ dùng trong DEV để bỏ kiểm TLS
    dispatcher: process.env.NODE_ENV === 'development' ? insecureAgent : undefined,
    // cache: 'no-store' // nếu cần tắt cache khi dev
  };

  const res = await fetch(target, init);

  // làm sạch header có thể gây lỗi stream
  const outHeaders = new Headers(res.headers);
  outHeaders.delete('content-encoding');
  outHeaders.delete('transfer-encoding');

  return new Response(res.body, { status: res.status, headers: outHeaders });
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
  forward as OPTIONS,
};
