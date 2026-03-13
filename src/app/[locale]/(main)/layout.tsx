import { Sidebar } from '@/components/layout/Sidebar';
import { Advertisement } from '@/components/Advertisement';

export const dynamic = 'force-dynamic';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-14 p-4 md:p-8">
        {/* 全局广告 */}
        <Advertisement type="global" />
        {children}
      </main>
    </div>
  );
}
