import type { NextAuthConfig } from 'next-auth'

// Edge Runtime에서 사용 가능한 설정 (DB 임포트 없음)
// middleware.ts에서 이 설정만 사용
export const authConfig = {
  providers: [],
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/ko/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token && session.user) session.user.id = token.id as string
      return session
    },
  },
} satisfies NextAuthConfig
