import NextAuth from "next-auth"
import { authConfig } from "./config"

// Create and export the NextAuth instance with our config
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)