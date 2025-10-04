'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';

type UserRow = {
  id: string;
  userName: string;
  email: string;
  role: string;
  isPro: boolean;
  online: boolean;
  totalCoins: number;
  totalGmails: number;
};

export default function UsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(p = page, sz = pageSize, q = search) {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiGet<{ total: number; page: number; pageSize: number; items: UserRow[] }>(
        `/api/admin/users/overview?page=${p}&pageSize=${sz}&search=${encodeURIComponent(q)}`
      );
      setItems(resp.items);
      setTotal(resp.total);
      setPage(resp.page);
      setPageSize(resp.pageSize);
    } catch (e: any) {
      setError(e?.body || 'Không tải được danh sách user');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, pageSize, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function credit(username: string, amount: number) {
    await apiPost('/api/admin/users/credit-by-username', { username, amount, note: 'Admin credit' });
    await load();
  }
  async function debit(username: string, amount: number) {
    await apiPost('/api/admin/users/debit-by-username', { username, amount, note: 'Admin debit' });
    await load();
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container">
      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="head" style={{ gap: 12, flexWrap: 'wrap' }}>
          <h2>Quản lý User</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              className="input"
              placeholder="Tìm theo username/email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 220 }}
            />
            <button className="btn" onClick={() => load(1, pageSize, search)} disabled={loading}>
              Tìm
            </button>
          </div>
        </div>

        {error && <p className="small" style={{ color: '#ffb3b3' }}>{error}</p>}

        <div className="small" style={{ opacity: 0.8, marginBottom: 8 }}>
          Tổng: {total} users
        </div>
        <table className="table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Pro</th>
              <th>Online</th>
              <th>Tổng xu</th>
              <th>Tổng Gmail</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td style={{ fontFamily: 'ui-monospace' }}>
                  <Link href={`/admin/users/${u.id}`}>{u.userName}</Link>
                </td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.isPro ? 'Yes' : 'No'}</td>
                <td>{u.online ? <span className="badge green">Online</span> : <span className="badge gray">Off</span>}</td>
                <td>{u.totalCoins}</td>
                <td>{u.totalGmails}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className="btn"
                      onClick={() => {
                        const amt = Number(prompt(`Nạp xu cho ${u.userName}`, '1000') || '0');
                        if (amt > 0) credit(u.userName, amt);
                      }}
                    >
                      Nạp
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        const amt = Number(prompt(`Trừ xu của ${u.userName}`, '1000') || '0');
                        if (amt > 0) debit(u.userName, amt);
                      }}
                    >
                      Trừ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <button
            className="btn"
            disabled={page <= 1}
            onClick={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
              load(p);
            }}
          >
            Prev
          </button>
          <div className="small">Trang {page}/{pages}</div>
          <button
            className="btn"
            disabled={page >= pages}
            onClick={() => {
              const p = Math.min(pages, page + 1);
              setPage(p);
              load(p);
            }}
          >
            Next
          </button>
          <div style={{ flex: 1 }} />
          <label className="small">Page size</label>
          <select
            className="input"
            value={pageSize}
            onChange={(e) => {
              const sz = Number(e.target.value);
              setPageSize(sz);
              load(1, sz, search);
            }}
            style={{ width: 90 }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
