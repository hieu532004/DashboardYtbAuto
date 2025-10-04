'use client';
import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

type RewardCode = {
  id: string; code: string; amount: number;
  isRedeemed: boolean; redeemedByUserId?: string;
  redeemedAtUtc?: string; createdAtUtc?: string; expiresAtUtc?: string;
};

export default function RewardCodesPage() {
  // amount dùng string để xử lý "bỏ số 0 đầu", sau đó mới parse sang number khi submit
  const [amountStr, setAmountStr] = useState<string>('1000');
  const [qtyStr, setQtyStr] = useState<string>('10');
  const [expires, setExpires] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [sample, setSample] = useState<{ code: string; amount: number; expiresAtUtc?: string; }[]>([]);
  const [list, setList] = useState<RewardCode[]>([]);
  const [filter, setFilter] = useState<'all'|'used'|'unused'>('all');
  const [error, setError] = useState<string | null>(null);

  // helper: parse int >= 1 (nếu rỗng hoặc 0 thì mặc định 1)
  function parsePositiveInt(s: string, fallback = 1) {
    const n = parseInt(s || '', 10);
    return Number.isFinite(n) && n >= 1 ? n : fallback;
  }

  // onChange amount: bỏ số 0 đầu nhưng vẫn cho phép "0" duy nhất nếu rỗng
  function onAmountChange(raw: string) {
    // chỉ lấy ký tự số
    let v = raw.replace(/\D+/g, '');
    // nếu có nhiều số và bắt đầu bằng 0 -> bỏ các số 0 ở đầu
    v = v.replace(/^0+(?=\d)/, '');
    setAmountStr(v);
  }

  // onChange qty: như amount
  function onQtyChange(raw: string) {
    let v = raw.replace(/\D+/g, '');
    v = v.replace(/^0+(?=\d)/, '');
    setQtyStr(v);
  }

  async function createCodes(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setError(null);
    try {
      const amount = parsePositiveInt(amountStr, 1);
      const quantity = Math.min(parsePositiveInt(qtyStr, 1), 10000);

      const body: any = { amount, quantity, expiresAtUtc: expires || null };
      const resp = await apiPost<{ Amount:number; Quantity:number; ExpiresAtUtc?:string; Sample: any[]; }>(
        '/api/admin/reward-codes/bulk',
        body
      );
      setSample(resp.Sample || []);
      await loadList(filter);
    } catch (e:any) {
      setError(e?.body || 'Tạo mã thất bại');
    } finally {
      setCreating(false);
    }
  }

  async function loadList(which: 'all'|'used'|'unused') {
    setError(null);
    let path = '/api/admin/reward-codes';
    if (which === 'used') path += '?redeemed=true';
    if (which === 'unused') path += '?redeemed=false';
    try {
      const data = await apiGet<RewardCode[]>(path);
      setList(data);
    } catch (e:any) {
      setError(e?.body || 'Không tải được danh sách');
    }
  }

  useEffect(() => { loadList(filter); }, [filter]);

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h3>Tạo mã thưởng</h3>
          <form onSubmit={createCodes}>
            <div
              className="row"
              style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12
              }}
            >
              <div className="col">
                <label>Số xu / mã</label>
                <input
                  className="input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amountStr}
                  onChange={e=>onAmountChange(e.target.value)}
                  placeholder="vd: 1000"
                />
              </div>
              <div className="col">
                <label>Số lượng</label>
                <input
                  className="input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={qtyStr}
                  onChange={e=>onQtyChange(e.target.value)}
                  placeholder="vd: 10"
                />
              </div>
              <div className="col">
                <label>Hết hạn (UTC, tùy chọn)</label>
                <input className="input" type="datetime-local" value={expires} onChange={e=>setExpires(e.target.value)} />
              </div>
            </div>

            <div style={{ height:12 }} />
            <button className="btn" disabled={creating}>{creating ? 'Đang tạo...' : 'Tạo mã'}</button>
            {error && <p className="small" style={{ color:'#ffb3b3' }}>{error}</p>}
            <p className="small" style={{ marginTop:8 }}>
              API: POST <code>/api/admin/reward-codes/bulk</code> — trả về Sample tối đa 50 mã.
            </p>
          </form>

          {sample.length > 0 && (
            <div style={{ marginTop:16, overflowX:'auto' }}>
              <h4>Mẫu (tối đa 50 mã)</h4>
              <table className="table" style={{ minWidth: 560 }}>
                <thead><tr><th>Code</th><th>Amount</th><th>Expires</th></tr></thead>
                <tbody>
                  {sample.map((s, i)=>(
                    <tr key={i}>
                      <td style={{ fontFamily:'ui-monospace' }}>{s.code}</td>
                      <td>{s.amount}</td>
                      <td>{s.expiresAtUtc ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="col">
        <div className="card" style={{ overflowX:'auto' }}>
          <div className="head" style={{ gap: 12, flexWrap: 'wrap' }}>
            <h3>Danh sách mã</h3>
            <div>
              <select className="input" style={{ width: 180 }} value={filter} onChange={e=>setFilter(e.target.value as any)}>
                <option value="all">Tất cả</option>
                <option value="unused">Chưa dùng</option>
                <option value="used">Đã dùng</option>
              </select>
            </div>
          </div>
          <table className="table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Code</th><th>Amount</th><th>Trạng thái</th><th>Người dùng</th><th>Đổi lúc (UTC)</th><th>Tạo lúc (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {list.map(rc => (
                <tr key={rc.id}>
                  <td style={{ fontFamily:'ui-monospace' }}>{rc.code}</td>
                  <td>{rc.amount}</td>
                  <td>{rc.isRedeemed ? <span className="badge green">Đã dùng</span> : <span className="badge gray">Chưa dùng</span>}</td>
                  <td>{rc.redeemedByUserId ?? '—'}</td>
                  <td>{rc.redeemedAtUtc ?? '—'}</td>
                  <td>{rc.createdAtUtc ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsive hint card (tùy chọn) */}
      <div className="col" style={{ display:'none' }} />
    </div>
  );
}
