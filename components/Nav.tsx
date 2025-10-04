'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const path = usePathname();
  const items = [
    { href: '/admin/users', label: 'Users' },
    { href: '/admin', label: 'Tổng quan' },
    { href: '/admin/reward-codes', label: 'Mã thưởng' },
    { href: '/admin/credit', label: 'Nạp xu' },
    { href: '/admin/stats', label: 'Thống kê' },
  ];
  return (
    <div className="nav">
      {items.map(it => (
        <Link key={it.href} href={it.href} className={path === it.href ? 'active' : ''}>{it.label}</Link>
      ))}
    </div>
  );
}
