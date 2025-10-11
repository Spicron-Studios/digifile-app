import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CollapsibleSidebar } from '@/app/components/ui/collapsible-sidebar';
import { Header } from '@/app/components/ui/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DigiFile',
  description: 'Secure digital file management for healthcare',
};

export default function SitesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`flex h-screen ${inter.className}`}>
      <CollapsibleSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
