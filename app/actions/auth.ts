import { authConfig } from "@/app/api/auth/config"
import NextAuth from "next-auth"

export const { auth, signIn, signOut } = NextAuth(authConfig)

// Server action to get session data
export async function getSessionData() {
  const session = await auth()
  if (!session) return null
  
  return {
    user: {
      name: session.user?.name,
      email: session.user?.email,
      orgId: session.user?.orgId,
      role: session.user?.role
    }
  }
} 