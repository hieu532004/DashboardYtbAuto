// app/login/login-form.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPost, resolveApiUrl } from '@/lib/api';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading ] = useState(false);
  const [error,    setError   ] = useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await apiPost<{ token?: string; accessToken?: string; jwt?: string }>(
        '/api/auth/login',
        { username, password }
      );
      const token = r.token ?? r.accessToken ?? r.jwt;
      if (!token) throw new Error('Không thấy token');

      localStorage.setItem('admin_jwt', token);
      router.replace(next);
    } catch (ex: any) {
      setError(ex?.body || ex?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'grid', placeItems: 'center' }}>
      <form onSubmit={onSubmit} className="card" style={{ width: 420, padding: 24 }}>
        <h2>Admin Login</h2>
        <div className="mt-3">
          <label className="small">Tài khoản</label>
          <input className="input" value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
        <div className="mt-2">
          <label className="small">Mật khẩu</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {error && <p className="small" style={{ color: '#ff9b9b', marginTop: 8 }}>{error}</p>}
        <button className="btn" disabled={loading} style={{ marginTop: 12, width: '100%' }}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        {/* Debug: phải hiển thị /api-proxy/api/auth/login trên Vercel */}
        <p className="small" style={{ opacity: .7, marginTop: 10 }}>
          API: POST <code>{resolveApiUrl('/api/auth/login')}</code>
        </p>
      </form>
    </div>
  );
}
