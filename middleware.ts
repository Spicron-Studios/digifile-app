import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnSitesPage = req.nextUrl.pathname.startsWith('/sites')

  // If trying to access /sites/* without being logged in
  if (isOnSitesPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login/signin', req.url))
  }

  // If logged in and trying to access login pages, redirect to /sites
  if (isLoggedIn && req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/sites', req.url))
  }

  return NextResponse.next()
})

// Specify which routes to run the middleware on
export const config = {
  matcher: ['/sites/:path*', '/login/:path*']
} 