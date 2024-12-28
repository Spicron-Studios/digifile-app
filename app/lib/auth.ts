import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/app/lib/prisma"
import type { DefaultSession } from "next-auth"

// Add type definitions for extended session
interface ExtendedSession extends DefaultSession {
  user: {
    orgId: string;
    roles: {
      role: {
        uid: string;
        name: string;
      };
    }[];
  } & DefaultSession["user"]
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.orgId = user.orgid
        const userRoles = await prisma.user_roles.findMany({
          where: {
            userid: user.uid,
            active: true,
            orgid: user.orgid
          }
        })

        const rolesWithDetails = await Promise.all(
          userRoles.map(async (userRole) => {
            const roleDetails = await prisma.roles.findFirst({
              where: {
                uid: userRole.roleid,
                active: true
              }
            })
            return {
              ...userRole,
              role: roleDetails
            }
          })
        )

        token.roles = rolesWithDetails
      }
      return token
    },
    async session({ session, token }): Promise<ExtendedSession> {
      if (session.user) {
        session.user.orgId = token.orgId as string
        session.user.roles = token.roles as ExtendedSession["user"]["roles"]
      }
      return session
    }
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        bfhNumber: { label: "BFH Number", type: "text" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.bfhNumber || !credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const org = await prisma.organization_info.findFirst({
            where: {
              bhf_number: credentials.bfhNumber,
              active: true
            }
          })

          if (!org) return null

          const user = await prisma.users.findFirst({
            where: {
              username: credentials.username,
              orgid: org.uid,
              secret_key: credentials.password,
              active: true
            }
          })

          if (!user) return null

          return {
            id: user.uid,
            name: `${user.first_name} ${user.surname}`,
            email: user.email,
            orgid: user.orgid
          }
        } catch (error) {
          return null
        }
      }
    })
  ]
})