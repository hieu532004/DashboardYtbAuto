'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPost, resolveApiUrl } from '@/lib/api';
import { saveToken, type LoginResp } from '@/lib/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string>('');
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/admin';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await apiPost<LoginResp>('/api/auth/login', { username, password });
      const token = r.token || r.accessToken || r.jwt;
      if (!token) throw new Error('API không trả về token');
      saveToken(token);
      router.replace(next); // chuyển vào dashboard
    } catch (e: any) {
      setError(e?.body || e?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center" style={{ maxWidth: 420, margin: '64px auto' }}>
      <h2>Đăng nhập Admin</h2>
      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <div className="field">
          <label>Tên đăng nhập</label>
          <input className="input" value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
        <div className="field" style={{ marginTop: 8 }}>
          <label>Mật khẩu</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {error && <p className="small" style={{color:'#ff9b9b', marginTop:8}}>{error}</p>}
        <button className="btn" disabled={loading} style={{marginTop:12, width:'100%'}}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        {/* debug: xem URL gọi tới đâu */}
        <p className="small" style={{opacity:.7, marginTop:10}}>
          API: POST <code>{resolveApiUrl('/api/auth/login')}</code>
        </p>
      </form>
    </div>
  );
}
