import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-secret-change-in-production'
)

const PUBLIC_PATHS = ['/', '/login', '/register']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p)
  const token = request.cookies.get('session')?.value

  // Let unauthenticated users access public paths
  if (isPublic) {
    if (token) {
      try {
        await jwtVerify(token, secret)
        // Already logged in → redirect to leaderboard
        if (pathname === '/login' || pathname === '/register') {
          return NextResponse.redirect(new URL('/leaderboard', request.url))
        }
      } catch {
        // Invalid token, continue
      }
    }
    return NextResponse.next()
  }

  // Protected paths: require valid session
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)

    // Admin paths: require isAdmin
    if (pathname.startsWith('/admin')) {
      if (!payload.isAdmin) {
        return NextResponse.redirect(new URL('/leaderboard', request.url))
      }
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
