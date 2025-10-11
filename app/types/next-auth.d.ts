import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      orgId: string;
      role: {
        uid: string;
        name: string;
      } | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    orgId: string;
    role: {
      uid: string;
      name: string;
    } | null;
  }
}
