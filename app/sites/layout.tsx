import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CollapsibleSidebar } from "@/app/components/ui/collapsible-sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DigiFile",
  description: "Secure digital file management for healthcare",
};

export default function SitesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`flex h-screen ${inter.className}`}>
      <CollapsibleSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
