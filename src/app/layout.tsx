import type { Metadata } from 'next';
import './globals.css';
import FloatingSidebar from './components/FloatingSidebar';

export const metadata: Metadata = {
  title: 'Mahotsav Restobar | POS Suite',
  description: 'Full-stack Restobar POS, KDS & Floor Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f4f5f7] text-zinc-900 antialiased">
        <FloatingSidebar />
        <main>{children}</main>
      </body>
    </html>
  );
}