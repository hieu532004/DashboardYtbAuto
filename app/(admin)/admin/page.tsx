'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, type ApiError } from '@/lib/api';
import { useRouter } from 'next/navigation';

type RewardCode = {
  id: string;
  code: string;
  amount: number;
  isRedeemed: boolean;
  redeemedByUserId?: string;
  redeemedAtUtc?: string;
  createdAtUtc?: string;
};

export default function AdminHome() {
  const router = useRouter();

  const [used, setUsed] = useState<number | null>(null);
  const [unused, setUnused] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // gọi song song cho nhanh
      const [a, b] = await Promise.all([
        apiGet<RewardCode[]>('/api/admin/reward-codes?redeemed=true'),
        apiGet<RewardCode[]>('/api/admin/reward-codes?redeemed=false'),
      ]);
      setUsed(a.length);
      setUnused(b.length);
    } catch (e: any) {
      const err = e as ApiError | undefined;
      // nếu token hết hạn / chưa đăng nhập → về /login
      if (err?.status === 401) {
        try { localStorage.removeItem('admin_jwt'); } catch {}
        router.replace('/login?next=/'); // đổi next=... theo route bạn muốn
        return;
      }
      setError(err?.body || err?.toString?.() || 'Không tải được số liệu');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await load();
      if (!alive) return;
    })();
    return () => { alive = false; };
  }, [load]);

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <h3 style={{ margin: 0 }}>Tóm tắt mã thưởng</h3>
            <button className="btn" onClick={load} disabled={loading}>
              {loading ? 'Đang tải...' : 'Tải lại'}
            </button>
          </div>

          {error && (
            <p className="small" style={{ color:'#ffb3b3', marginTop:8 }}>
              {error}
            </p>
          )}

          <div style={{ display:'flex', gap:24, marginTop:16, flexWrap:'wrap' }}>
            <div style={{ minWidth:180 }}>
              <div className="badge gray">Chưa dùng</div>
              <h2 style={{ margin:'8px 0' }}>
                {loading && unused === null ? '—' : (unused ?? 0)}
              </h2>
            </div>
            <div style={{ minWidth:180 }}>
              <div className="badge green">Đã dùng</div>
              <h2 style={{ margin:'8px 0' }}>
                {loading && used === null ? '—' : (used ?? 0)}
              </h2>
            </div>
          </div>

          <p className="small" style={{ marginTop:12, opacity:.7 }}>
            API: GET <code>/api/admin/reward-codes?redeemed=true|false</code>
          </p>
        </div>
      </div>
    </div>
  );
}
