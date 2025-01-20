import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/app/lib/prisma"

// Only keep ExtendedUser interface
interface ExtendedUser {
  orgid: string;
  uid: string;
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
    async jwt({ token, user: dbUser }) {
      const user = dbUser as ExtendedUser | null
      if (user) {
        token.id = user.uid
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
                uid: userRole.roleid!,
                active: true
              }
            })
            return {
              role: {
                uid: roleDetails?.uid || '',
                name: roleDetails?.role_name || ''
              }
            }
          })
        )
        token.roles = rolesWithDetails
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          orgId: token.orgId as string,
          roles: token.roles
        }
      }
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
            uid: user.uid,
            name: `${user.first_name} ${user.surname}`,
            email: user.email,
            orgid: user.orgid
          }
        } catch (error) {
          console.error('Error during authorization:', error)
          return null
        }
      }
    })
  ]
})