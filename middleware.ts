import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Edge-safe: DB 없이 JWT만으로 세션 확인
const { auth } = NextAuth(authConfig)

const intlMiddleware = createMiddleware({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
})

const protectedPaths = ['/feed', '/playlist/new', '/me']

export default auth(async function middleware(request: NextRequest & { auth: unknown }) {
  const { pathname } = request.nextUrl

  const localeMatch = pathname.match(/^\/(ko|en)(.*)/)
  if (localeMatch) {
    const localePath = localeMatch[2]
    const isProtected =
      protectedPaths.some((p) => localePath === p || localePath.startsWith(p + '/')) ||
      /^\/playlist\/[^/]+\/edit/.test(localePath)

    if (isProtected && !(request as { auth: unknown }).auth) {
      const locale = localeMatch[1]
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return intlMiddleware(request)
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
