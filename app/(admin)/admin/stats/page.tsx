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

          {/* Bảng chi tiết phẳng */}
          <div style={{ marginTop: 12, overflowX:'auto' }}>
            <table className="table" style={{ minWidth: 720 }}>
              <thead>
                <tr><th>Tháng</th><th>User</th><th>Tổng xu nạp</th></tr>
              </thead>
              <tbody>
                {flatTable.map((r, i) => (
                  <tr key={i}>
                    <td>{r.month}</td>
                    <td>{r.username}</td>
                    <td>{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="small" style={{ marginTop:8 }}>
            API: GET <code>/api/admin/wallet/credits-monthly?year={year}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
