import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: string;
      roles: {
        role: {
          uid: string;
          name: string;
        };
      }[];
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: string;
    roles: {
      role: {
        uid: string;
        name: string;
      };
    }[];
  }
} 