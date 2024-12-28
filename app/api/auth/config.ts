import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/app/lib/prisma"
import type { User } from "next-auth"

// Add type definitions for extended token and session
interface ExtendedToken {
  orgId: string;
  roles: {
    role: {
      uid: string;
      name: string;
      // add other role properties as needed
    };
  }[];
}

interface ExtendedSession {
  user: {
    orgId: string;
    roles: ExtendedToken['roles'];
  } & DefaultSession['user'];
}

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.orgId = user.orgid
        // First get user roles
        const userRoles = await prisma.user_roles.findMany({
          where: {
            userid: user.uid,
            active: true,
            orgid: user.orgid
          }
        })

        // Then fetch role details for each role
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
      return token as JWT & ExtendedToken
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.orgId = token.orgId
        session.user.roles = token.roles
      }
      return session as ExtendedSession
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
          } as User
        } catch (error) {
          return null
        }
      }
    })
  ]
} 