import { auth, signIn, signOut } from "@/app/lib/auth"

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

export { auth, signIn, signOut } 