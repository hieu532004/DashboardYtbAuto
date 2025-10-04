'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

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

      // LƯU đúng key này để mọi apiGet/apiPost tự gắn Authorization
      localStorage.setItem('admin_jwt', token);

      router.replace('/dashboard'); // đổi path theo app của bạn
    } catch (err: any) {
      setError(err?.body || err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{maxWidth:360, margin:'40px auto'}}>
      <h2>Đăng nhập</h2>
      <div style={{margin:'8px 0'}}>
        <label>Tài khoản</label>
        <input value={username} onChange={e=>setUsername(e.target.value)} required />
      </div>
      <div style={{margin:'8px 0'}}>
        <label>Mật khẩu</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      </div>
      {error && <p style={{color:'#f99'}}>{error}</p>}
      <button disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
    </form>
  );
}
