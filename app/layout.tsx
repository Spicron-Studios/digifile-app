
import type { Metadata } from "next";
import "./globals.css";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";

export const metadata: Metadata = {
  title: "Under Construction",
  description: "Site under construction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        <div className="flex h-screen">
          <CollapsibleSidebar />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
