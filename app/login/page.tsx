'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, resolveApiUrl } from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string>('');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await apiPost<{ token?: string; accessToken?: string; jwt?: string }>(
        '/api/auth/login',
        { username, password }
      );
      const token = resp.token ?? resp.accessToken ?? resp.jwt;
      if (!token) throw new Error('Không tìm thấy token trong phản hồi');

      // LƯU đúng key này để mọi request sau tự gắn Authorization
      localStorage.setItem('admin_jwt', token);

      router.replace('/dashboard'); // đổi route theo app của bạn
    } catch (err: any) {
      console.error('LOGIN_ERROR', err);
      setError(err?.body || err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'calc(100vh - 120px)', display:'grid', placeItems:'center'}}>
      <form onSubmit={onSubmit} className="card" style={{width:420, padding:24}}>
        <h2>Admin Login</h2>
        <div className="mt-3">
          <label className="small">Tên đăng nhập</label>
          <input className="input" value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
        <div className="mt-2">
          <label className="small">Mật khẩu</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {error && <p className="small" style={{color:'#ff9b9b', marginTop:8}}>{error}</p>}
        <button className="btn" disabled={loading} style={{marginTop:12, width:'100%'}}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        {/* Debug dòng dưới để bạn chắc chắn FE đang gọi qua proxy */}
        <p className="small" style={{opacity:.7, marginTop:10}}>
          API: POST <code>{resolveApiUrl('/api/auth/login')}</code>
        </p>
      </form>
    </div>
  );
}
