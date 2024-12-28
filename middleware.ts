import { auth } from "@/app/lib/auth"

export default auth

export const config = {
  matcher: [
    "/sites/:path*",
    "/api/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)"
  ]
} 