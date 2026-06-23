import NextAuth from 'next-auth'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { clientPromise, connectDB } from './mongodb'
import { User } from './models/User'

function NaverProvider() {
  return {
    id: 'naver',
    name: 'Naver',
    type: 'oauth' as const,
    authorization: {
      url: 'https://nid.naver.com/oauth2.0/authorize',
      params: { response_type: 'code' },
    },
    token: 'https://nid.naver.com/oauth2.0/token',
    userinfo: {
      url: 'https://openapi.naver.com/v1/nid/me',
      async request({ tokens }: { tokens: { access_token?: string } }) {
        const res = await fetch('https://openapi.naver.com/v1/nid/me', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const data = await res.json()
        return data.response
      },
    },
    profile(profile: Record<string, string>) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.profile_image ?? null,
      }
    },
    clientId: process.env.NAVER_CLIENT_ID!,
    clientSecret: process.env.NAVER_CLIENT_SECRET!,
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    NaverProvider(),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await connectDB()
        const user = await User.findOne({ email: credentials.email as string }).lean()
        if (!user || !user.password) return null
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!isValid) return null
        return { id: user._id.toString(), email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/ko/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token && session.user) session.user.id = token.id as string
      return session
    },
  },
})
