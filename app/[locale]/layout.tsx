import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Inter } from 'next/font/google'
import '../globals.css'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'
import Sidebar from '@/components/ui/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | Vibe',
    default: 'Vibe',
  },
  openGraph: {
    siteName: 'Vibe',
    type: 'website',
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  const session = await auth()

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <NextIntlClientProvider messages={messages}>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-[68px] min-h-screen">{children}</main>
            </div>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
