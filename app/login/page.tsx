'use client';
import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { saveToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await apiPost<{ token: string }>('/api/auth/login', { username, password });
      saveToken(resp.token);
      router.replace('/admin');
    } catch (err: any) {
      setError(err?.body || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '60px auto' }}>
        <h2>Admin Login</h2>
        <form onSubmit={submit}>
          <label>Tên đăng nhập</label>
          <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin" />
          <div style={{ height: 12 }} />
          <label>Mật khẩu</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="********" />
          <div style={{ height: 16 }} />
          <button className="btn" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
          {error && <p className="small" style={{ color: '#ffb3b3', marginTop: 10 }}>{error}</p>}
        </form>
        <p className="small" style={{ marginTop: 12, opacity: .7 }}>API: POST /api/auth/login</p>
      </div>
    </div>
  );
}
