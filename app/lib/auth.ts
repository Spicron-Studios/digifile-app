import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import db, {
  organizationInfo,
  users,
  userRoles,
  roles,
} from '@/app/lib/drizzle';
import { eq, and } from 'drizzle-orm';

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
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user: dbUser }) {
      const user = dbUser as ExtendedUser | null;
      if (user) {
        token.id = user.uid;
        token.orgId = user.orgid;

        // Get user roles using Drizzle
        const userRolesList = await db
          .select()
          .from(userRoles)
          .where(
            and(
              eq(userRoles.userid, user.uid),
              eq(userRoles.active, true),
              eq(userRoles.orgid, user.orgid)
            )
          );

        const rolesWithDetails = await Promise.all(
          userRolesList.map(async userRole => {
            const roleDetails = await db
              .select()
              .from(roles)
              .where(
                and(eq(roles.uid, userRole.roleid!), eq(roles.active, true))
              )
              .limit(1);

            return {
              role: {
                uid: roleDetails[0]?.uid || '',
                name: roleDetails[0]?.roleName || '',
              },
            };
          })
        );
        token.roles = rolesWithDetails;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          orgId: token.orgId as string,
          roles: token.roles,
        },
      };
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        bfhNumber: { label: 'BFH Number', type: 'text' },
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (
          !credentials?.bfhNumber ||
          !credentials?.username ||
          !credentials?.password
        ) {
          return null;
        }

        try {
          // Find organization using Drizzle
          const orgResults = await db
            .select()
            .from(organizationInfo)
            .where(
              and(
                eq(organizationInfo.bhfNumber, credentials.bfhNumber as string),
                eq(organizationInfo.active, true)
              )
            )
            .limit(1);

          if (orgResults.length === 0) return null;
          const org = orgResults[0];
          if (!org) return null;

          // Find user using Drizzle
          const userResults = await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.username, credentials.username as string),
                eq(users.orgid, org.uid),
                eq(users.active, true)
              )
            )
            .limit(1);

          if (userResults.length === 0) return null;
          const user = userResults[0];
          if (!user) return null;

          // Direct password comparison (no encryption for now)
          if (user.secretKey !== credentials.password) return null;

          return {
            uid: user.uid,
            name: `${user.firstName || ''} ${user.surname || ''}`.trim(),
            email: user.email || '',
            orgid: user.orgid || '',
          };
        } catch (error) {
          console.error('Error during authorization:', error);
          return null;
        }
      },
    }),
  ],
});
