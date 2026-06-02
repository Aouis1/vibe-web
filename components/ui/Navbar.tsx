'use client'

import { useTranslations } from 'next-intl'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'

export default function Navbar() {
  const t = useTranslations('nav')
  const { data: session } = useSession()
  const params = useParams()
  const pathname = usePathname()
  const locale = (params?.locale as string) || 'ko'
  const [menuOpen, setMenuOpen] = useState(false)

  const otherLocale = locale === 'ko' ? 'en' : 'ko'
  const switchPath = pathname.replace(`/${locale}`, `/${otherLocale}`)

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="text-xl font-black tracking-tight text-violet-400">
          Vibe
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href={`/${locale}/explore`} className="text-zinc-400 hover:text-white transition">
            {t('explore')}
          </Link>
          {session && (
            <>
              <Link href={`/${locale}/feed`} className="text-zinc-400 hover:text-white transition">
                {t('feed')}
              </Link>
              <Link href={`/${locale}/playlist/new`} className="text-zinc-400 hover:text-white transition">
                {t('newPlaylist')}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={switchPath}
            className="text-xs text-zinc-500 hover:text-white transition px-2 py-1 rounded border border-zinc-700"
          >
            {otherLocale.toUpperCase()}
          </Link>

          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || ''}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 bg-zinc-900 border border-zinc-700 rounded-lg py-1 w-40 shadow-xl">
                  <Link
                    href={`/${locale}/me`}
                    className="block px-4 py-2 text-sm hover:bg-zinc-800 transition"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('profile')}
                  </Link>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 transition text-red-400"
                  >
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-full text-sm font-medium transition"
            >
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
