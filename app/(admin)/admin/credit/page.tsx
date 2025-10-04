'use client';
import { useState } from 'react';
import { apiPost } from '@/lib/api';

export default function CreditPage() {
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState<string>('1000'); // cho phép nhập tự do, không cắt số 0 đầu
  const [note, setNote] = useState<string>('Admin operation');
  const [loading, setLoading] = useState<'credit' | 'debit' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function parseAmount(): number {
    // Không cắt số 0 đầu; chỉ chuyển thành số và kiểm tra > 0
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }

  async function doCredit() {
    setErr(null); setMsg(null);
    const n = parseAmount();
    if (!username.trim()) return setErr('Vui lòng nhập Username');
    if (n <= 0) return setErr('Số xu phải > 0');

    setLoading('credit');
    try {
      const resp = await apiPost<{ userId: string; username: string; wallet: { balance: number } }>(
        '/api/admin/users/credit-by-username',
        { username: username.trim(), amount: n, note }
      );
      setMsg(`✅ Đã NẠP ${n} xu cho ${resp.username}. Số dư mới: ${resp.wallet?.balance ?? '—'}`);
    } catch (e: any) {
      setErr(e?.body || e?.message || 'Nạp xu thất bại');
    } finally {
      setLoading(null);
    }
  }

  async function doDebit() {
    setErr(null); setMsg(null);
    const n = parseAmount();
    if (!username.trim()) return setErr('Vui lòng nhập Username');
    if (n <= 0) return setErr('Số xu phải > 0');

    setLoading('debit');
    try {
      const resp = await apiPost<{ userId: string; username: string; wallet: { balance: number } }>(
        '/api/admin/users/debit-by-username',
        { username: username.trim(), amount: n, note }
      );
      setMsg(`✅ ĐÃ TRỪ ${n} xu của ${resp.username}. Số dư mới: ${resp.wallet?.balance ?? '—'}`);
    } catch (e: any) {
      setErr(e?.body || e?.message || 'Trừ xu thất bại');
    } finally {
      setLoading(null);
    }
  }

  const presets = ['1000', '5000', '10000', '20000', '50000'];

  return (
    <div className="row">
      <div className="col">
        <div className="card">
          <h3>Quản lý Xu theo UserName</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
            <div>
              <label>UserName</label>
              <input
                className="input"
                placeholder="ví dụ: hieu.nguyen"
                value={username}
                onChange={(e)=>setUsername(e.target.value)}
              />
            </div>

            <div>
              <label>Số xu</label>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e)=>setAmount(e.target.value)}
              />
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                {presets.map(p => (
                  <button
                    key={p}
                    type="button"
                    className="btn"
                    onClick={()=>setAmount(p)}
                    style={{ padding:'6px 10px' }}
                  >
                    +{p}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn"
                  onClick={()=>setAmount('')}
                  style={{ padding:'6px 10px', background:'#334155' }}
                >
                  Xóa
                </button>
              </div>
            </div>

            <div>
              <label>Ghi chú (tùy chọn)</label>
              <input
                className="input"
                value={note}
                onChange={(e)=>setNote(e.target.value)}
                placeholder="VD: bonus tháng 10"
              />
            </div>
          </div>

          <div style={{ height:12 }} />

          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn" disabled={loading !== null} onClick={doCredit}>
              {loading === 'credit' ? 'Đang nạp...' : 'Nạp xu'}
            </button>
            <button className="btn" disabled={loading !== null} onClick={doDebit} style={{ background:'#dc2626' }}>
              {loading === 'debit' ? 'Đang trừ...' : 'Trừ xu'}
            </button>
          </div>

          <p className="small" style={{ marginTop: 10, opacity:.7 }}>
            API: <code>POST /api/admin/users/credit-by-username</code> &nbsp;·&nbsp;
            <code>POST /api/admin/users/debit-by-username</code>
          </p>

          {msg && <p className="small" style={{ color:'#b8f3cd', marginTop: 10 }}>{msg}</p>}
          {err && <p className="small" style={{ color:'#ffb3b3', marginTop: 10 }}>{err}</p>}
        </div>
      </div>

      {/* Gợi ý nhanh (responsive) */}
      <div className="col">
        <div className="card">
          <h3>Gợi ý</h3>
          <ul className="small" style={{ margin:0, paddingLeft: '1em' }}>
            <li>Nhập <b>UserName</b> chính xác (không phân biệt hoa/thường).</li>
            <li>Cho phép số thập phân (step 0.01), không giới hạn độ dài — backend dùng <code>decimal</code>.</li>
            <li>Nếu trừ xu: hệ thống sẽ kiểm tra số dư & trả lỗi khi không đủ.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
