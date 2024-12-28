import NextAuth from "next-auth"
import { authConfig } from "./app/api/auth/config"

export const middleware = NextAuth(authConfig).auth

export const config = {
  matcher: [
    // Add routes that need authentication
    "/sites/:path*",
    "/api/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)"
  ]
} 