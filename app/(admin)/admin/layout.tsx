import Nav from '@/components/Nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
