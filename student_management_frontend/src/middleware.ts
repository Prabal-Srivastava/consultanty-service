import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value
  const userType = request.cookies.get('user_type')?.value
  const { pathname } = request.nextUrl

  // Define public routes that don't need authentication
  const isPublicRoute = 
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/forgot-password' || 
    pathname === '/reset-password' ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/courses') ||
    pathname.startsWith('/faq') ||
    pathname.startsWith('/help-center') ||
    pathname.startsWith('/verify-email')

  // 1. If trying to access protected route without token
  const protectedRoutes = ['/dashboard', '/chat', '/mentorship', '/placements', '/guidance']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!authToken && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    // Add original path as redirect param
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. If logged in and trying to access login/register
  if (authToken && (pathname === '/login' || pathname === '/register')) {
    let dashboardPath = '/dashboard'
    if (userType === 'student') dashboardPath = '/dashboard/student'
    else if (userType === 'tutor') dashboardPath = '/dashboard/tutor'
    else if (userType === 'admin') dashboardPath = '/dashboard/admin'
    
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }

  // 3. Ensure user type matches the dashboard path
  if (authToken && pathname.startsWith('/dashboard/')) {
    if (pathname.startsWith('/dashboard/student') && userType !== 'student') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (pathname.startsWith('/dashboard/tutor') && userType !== 'tutor') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (pathname.startsWith('/dashboard/admin') && userType !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
