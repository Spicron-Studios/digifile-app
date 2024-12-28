import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      orgId: string
      role: {
        role_name: string
        description: string
      }
    } & DefaultSession["user"]
  }

  interface JWT {
    orgId: string
    role: {
      role_name: string
      description: string
    }
  }
} 