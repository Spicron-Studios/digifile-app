import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
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
}

declare module "next-auth/jwt" {
  interface JWT {
    orgId: string;
    roles: {
      role: {
        uid: string;
        name: string;
      };
    }[];
  }
} 