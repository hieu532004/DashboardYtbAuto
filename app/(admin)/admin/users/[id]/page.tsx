'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';

type Tx = { id: string; type: string; amount: number; note?: string; createdAtUtc: string };
type Detail = {
  id: string; userName: string; email: string; role: string; isPro: boolean;
  lastSeenUtc?: string; online: boolean; totalGmails: number;
  wallet: { balance: number };
};

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [info, setInfo] = useState<Detail | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const d = await apiGet<Detail>(`/api/admin/users/${id}`);
      setInfo(d);
      const t = await apiGet<{ total:number; page:number; pageSize:number; items: Tx[] }>(`/api/admin/users/${id}/wallet-txs?page=${page}&pageSize=${pageSize}`);
      setTxs(t.items); setTotal(t.total);
    } catch (e:any) {
      setErr(e?.body || 'Không tải được dữ liệu');
    } finally { setLoading(false); }
  }

  useEffect(()=>{ if(id) load(); }, [id, page, pageSize]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container">
      <div className="head" style={{ gap: 12, flexWrap: 'wrap' }}>
        <h2>Chi tiết User</h2>
        <a href="/admin/users" className="small">« Quay lại danh sách</a>
      </div>

      {err && <p className="small" style={{ color:'#ffb3b3' }}>{err}</p>}

      {info && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
            <div><div className="small">User</div><div style={{ fontFamily:'ui-monospace' }}>{info.userName}</div></div>
            <div><div className="small">Email</div><div>{info.email}</div></div>
            <div><div className="small">Role</div><div>{info.role}</div></div>
            <div><div className="small">Pro</div><div>{info.isPro ? 'Yes' : 'No'}</div></div>
            <div><div className="small">Online</div><div>{info.online ? <span className="badge green">Online</span> : <span className="badge gray">Off</span>}</div></div>
            <div><div className="small">Last seen (UTC)</div><div>{info.lastSeenUtc ?? '—'}</div></div>
            <div><div className="small">Số dư</div><div>{info.wallet?.balance ?? 0}</div></div>
            <div><div className="small">Tổng Gmail</div><div>{info.totalGmails}</div></div>
          </div>
        </div>
      )}

      <div className="card" style={{ overflowX:'auto' }}>
        <h3>Lịch sử giao dịch ví</h3>
        <table className="table" style={{ minWidth: 720 }}>
          <thead>
            <tr><th>Loại</th><th>Số tiền</th><th>Ghi chú</th><th>Thời gian (UTC)</th></tr>
          </thead>
          <tbody>
            {txs.map(tx => (
              <tr key={tx.id}>
                <td>{tx.type}</td>
                <td>{tx.amount}</td>
                <td>{tx.note ?? '—'}</td>
                <td>{tx.createdAtUtc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:12, flexWrap:'wrap' }}>
          <button className="btn" disabled={page<=1} onClick={()=>setPage(p => Math.max(1, p-1))}>Prev</button>
          <div className="small">Trang {page}/{pages}</div>
          <button className="btn" disabled={page>=pages} onClick={()=>setPage(p => Math.min(pages, p+1))}>Next</button>
          <div style={{ flex: 1 }} />
          <label className="small">Page size</label>
          <select className="input" value={pageSize} onChange={e=>{ const sz = Number(e.target.value); setPageSize(sz); setPage(1); }} style={{ width:90 }}>
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
