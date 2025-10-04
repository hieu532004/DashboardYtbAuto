'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

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
  const [used, setUsed] = useState<number | null>(null);
  const [unused, setUnused] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const a = await apiGet<RewardCode[]>('/api/admin/reward-codes?redeemed=true');
        const b = await apiGet<RewardCode[]>('/api/admin/reward-codes?redeemed=false');
        setUsed(a.length); setUnused(b.length);
      } catch (e: any) {
        setError(e?.body || 'Lỗi tải số liệu');
      }
    }
    load();
  }, []);

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h3>Tóm tắt mã thưởng</h3>
          {error && <p className="small" style={{ color:'#ffb3b3' }}>{error}</p>}
          <div style={{ display:'flex', gap:24, marginTop:12 }}>
            <div><div className="badge gray">Chưa dùng</div><h2>{unused ?? '...'}</h2></div>
            <div><div className="badge green">Đã dùng</div><h2>{used ?? '...'}</h2></div>
          </div>
          <p className="small">API: GET /api/admin/reward-codes?redeemed=true|false</p>
        </div>
      </div>
    </div>
  );
}
