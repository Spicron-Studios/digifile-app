import { auth } from "@/app/lib/auth"
import { ClientHeader } from "@/app/components/ui/client-header"

export async function Header() {
  const session = await auth()
  
  return <ClientHeader session={session} />
} 