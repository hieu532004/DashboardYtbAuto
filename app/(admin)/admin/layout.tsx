// app/(admin)/admin/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Nav from '@/components/Nav';
import { hasToken } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hasToken()) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/admin')}`);
    }
  }, [router, pathname]);

  return (
    <div className="container">
      <div className="head">
        <h1>Admin Dashboard</h1>
        <div><Nav /></div>
      </div>
      {children}
    </div>
  );
}
