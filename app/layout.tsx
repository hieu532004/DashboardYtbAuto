import './globals.css';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Admin tools for Reward Codes & Wallet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
