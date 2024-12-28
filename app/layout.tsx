import { Toaster } from 'sonner'
import "./globals.css"
import { AuthProvider } from "@/app/components/providers/AuthProvider"
import { getSessionData } from "@/app/actions/auth"

export const metadata = {
  title: "DigiFile",
  description: "",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionData()

  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        <AuthProvider>
          <div className="flex h-screen">
            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
          </div>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  )
}
