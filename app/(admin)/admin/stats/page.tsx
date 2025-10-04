'use client';
import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';
import {
  PieChart, Pie, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

type RewardCode = {
  id: string; code: string; amount: number; isRedeemed: boolean;
  redeemedByUserId?: string; redeemedAtUtc?: string; createdAtUtc?: string;
};

type CreditsMonthlyResp = {
  year: number;
  months: string[]; // ["2025-01", ... "2025-12"]
  items: { username: string; month: string; total: number }[];
};

export default function StatsPage() {
  // --- RewardCode pie ---
  const [used, setUsed] = useState<RewardCode[]>([]);
  const [unused, setUnused] = useState<RewardCode[]>([]);
  const [rcError, setRcError] = useState<string | null>(null);

  // --- Credits per month ---
  const nowYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(nowYear);
  const [cm, setCm] = useState<CreditsMonthlyResp | null>(null);
  const [cmError, setCmError] = useState<string | null>(null);
  const [loadingCm, setLoadingCm] = useState(false);

  useEffect(() => {
    async function loadPie() {
      try {
        setUsed(await apiGet<RewardCode[]>('/api/admin/reward-codes?redeemed=true'));
        setUnused(await apiGet<RewardCode[]>('/api/admin/reward-codes?redeemed=false'));
      } catch (e: any) {
        setRcError(e?.body || 'Không tải được thống kê mã thưởng');
      }
    }
    loadPie();
  }, []);

  async function loadCreditsMonthly(y: number) {
    setLoadingCm(true); setCmError(null);
    try {
      const data = await apiGet<CreditsMonthlyResp>(`/api/admin/wallet/credits-monthly?year=${y}`);
      setCm(data);
    } catch (e: any) {
      setCmError(e?.body || 'Không tải được thống kê xu nạp theo tháng');
    } finally {
      setLoadingCm(false);
    }
  }

  useEffect(() => { loadCreditsMonthly(year); }, [year]);

  const pieData = useMemo(() => [
    { name: 'Đã dùng', value: used.length },
    { name: 'Chưa dùng', value: unused.length },
  ], [used, unused]);

  // ==== Transform credits-monthly -> Recharts data ====
  // dataBar: [{ month:"2025-01", "hieu": 12000, "minh": 5000, ... }, ...]
  const { dataBar, usersInYear } = useMemo(() => {
    if (!cm) return { dataBar: [] as any[], usersInYear: [] as string[] };
    const users = Array.from(new Set(cm.items.map(i => i.username))).sort((a,b)=>a.localeCompare(b));
    const rows = cm.months.map(m => {
      const row: any = { month: m };
      for (const u of users) row[u] = 0;
      return row;
    });
    for (const it of cm.items) {
      const r = rows.find(r => r.month === it.month);
      if (r) r[it.username] = (r[it.username] || 0) + it.total;
    }
    return { dataBar: rows, usersInYear: users };
  }, [cm]);

  // Bảng phẳng: hiển thị từng item (username, month, total)
  const flatTable = useMemo(() => cm?.items ?? [], [cm]);

  // Helper cho nhãn trục tháng ngắn gọn
  function monthLabel(m: string) { // "2025-01" -> "01"
    return m.slice(5, 7);
  }

  // Tạo palette màu tự động (đơn giản)
  function colorAt(i: number) {
    const palette = [
      '#8884d8','#82ca9d','#ffc658','#8dd1e1','#a4de6c',
      '#d0ed57','#d88884','#84d8c1','#c684d8','#d8b384'
    ];
    return palette[i % palette.length];
  }

  // Gợi ý danh sách năm gần
  const yearOptions = Array.from({ length: 6 }, (_, i) => nowYear - i); // [2025, 2024, ..., 2020]

  // --- Pagination cho flat table ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10 | 20 | 50 | 100

  // Reset về trang 1 khi dữ liệu/size đổi
  useEffect(() => { setPage(1); }, [cm, pageSize]);

  const totalRows = flatTable.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalRows);

  const pagedFlat = useMemo(
    () => flatTable.slice(startIdx, endIdx),
    [flatTable, startIdx, endIdx]
  );

  // Tạo dải trang gọn gàng (ví dụ +/-2 quanh trang hiện tại)
  const pageWindow = 2;
  const pageNumbers = useMemo(() => {
    const from = Math.max(1, page - pageWindow);
    const to = Math.min(totalPages, page + pageWindow);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }, [page, totalPages]);

  return (
    <div className="row">
      {/* Pie: Reward Codes */}
      <div className="col">
        <div className="card">
          <h3>Thống kê mã thưởng</h3>
          {rcError && <p className="small" style={{ color:'#ffb3b3' }}>{rcError}</p>}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie dataKey="value" data={pieData} label />
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="small">API: GET <code>/api/admin/reward-codes?redeemed=true|false</code></p>
        </div>
      </div>

      {/* Bar: Credits per month per user */}
      <div className="col">
        <div className="card" style={{ overflowX: 'auto' }}>
          <div className="head" style={{ gap: 12, flexWrap:'wrap' }}>
            <h3>Xu nạp theo tháng (mỗi user)</h3>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <label className="small">Năm</label>
              <select className="input" value={year} onChange={e=>setYear(parseInt(e.target.value,10))}>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button className="btn" onClick={()=>loadCreditsMonthly(year)} disabled={loadingCm}>
                {loadingCm ? 'Đang tải...' : 'Tải lại'}
              </button>
            </div>
          </div>

          {cmError && <p className="small" style={{ color:'#ffb3b3' }}>{cmError}</p>}

          <div style={{ width:'100%', height: 340 }}>
            <ResponsiveContainer>
              <BarChart data={dataBar}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={monthLabel} />
                <YAxis />
                <Tooltip />
                <Legend />
                {usersInYear.map((u, idx) => (
                  <Bar key={u} dataKey={u} name={u} stackId="users" fill={colorAt(idx)} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bảng chi tiết phẳng + phân trang */}
          <div style={{ marginTop: 12, overflowX:'auto' }}>
            <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
              <span className="small">Hiển thị</span>
              <select
                className="input"
                value={pageSize}
                onChange={e => setPageSize(parseInt(e.target.value, 10))}
                style={{ width: 90 }}
              >
                {[10,20,50,100].map(s => <option key={s} value={s}>{s}/trang</option>)}
              </select>

              <span className="small" style={{ marginLeft: 'auto' }}>
                {totalRows === 0
                  ? 'Không có dữ liệu'
                  : `Hiển thị ${startIdx + 1}–${endIdx} / ${totalRows} bản ghi`}
              </span>
            </div>

            <table className="table" style={{ minWidth: 720 }}>
              <thead>
                <tr><th>Tháng</th><th>User</th><th>Tổng xu nạp</th></tr>
              </thead>
              <tbody>
                {pagedFlat.map((r, i) => (
                  <tr key={`${r.month}-${r.username}-${i}`}>
                    <td>{r.month}</td>
                    <td>{r.username}</td>
                    <td>{r.total}</td>
                  </tr>
                ))}
                {pagedFlat.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign:'center', opacity:.7, padding:'16px 8px' }}>
                    Không có dữ liệu để hiển thị
                  </td></tr>
                )}
              </tbody>
            </table>

            {/* Thanh phân trang */}
            <div style={{
              display:'flex', gap:8, alignItems:'center', justifyContent:'center',
              marginTop:12, flexWrap:'wrap'
            }}>
              <button
                className="btn"
                onClick={() => setPage(1)}
                disabled={page === 1}
                title="Trang đầu"
              >«</button>
              <button
                className="btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Trang trước"
              >‹</button>

              {pageNumbers[0] > 1 && <span className="small" style={{ opacity:.7 }}>…</span>}
              {pageNumbers.map(pn => (
                <button
                  key={pn}
                  className="btn"
                  onClick={() => setPage(pn)}
                  disabled={pn === page}
                  style={pn === page ? { opacity: 0.8, fontWeight: 700 } : {}}
                >
                  {pn}
                </button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < totalPages && <span className="small" style={{ opacity:.7 }}>…</span>}

              <button
                className="btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                title="Trang sau"
              >›</button>
              <button
                className="btn"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                title="Trang cuối"
              >»</button>
            </div>
          </div>

          <p className="small" style={{ marginTop:8 }}>
            API: GET <code>/api/admin/wallet/credits-monthly?year={year}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
