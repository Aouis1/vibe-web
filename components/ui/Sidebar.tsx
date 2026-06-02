'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import Image from 'next/image'

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200
        group/item
        ${active
          ? 'bg-zinc-800 text-white'
          : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-white'
        }
      `}
    >
      <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
        {icon}
      </span>
      <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 w-0 opacity-0 group-hover:w-28 group-hover:opacity-100">
        {label}
      </span>
    </Link>
  )
}

export default function Sidebar() {
  const { data: session } = useSession()
  const params = useParams()
  const pathname = usePathname()
  const locale = (params?.locale as string) || 'ko'

  const isActive = (path: string) => pathname.startsWith(`/${locale}${path}`)

  return (
    <aside className="
      group
      fixed left-0 top-0 h-full z-50
      flex flex-col
      bg-[#0a0a0a] border-r border-zinc-800
      w-[68px] hover:w-52
      transition-all duration-300 ease-in-out
      overflow-hidden
    ">
      {/* Logo */}
      <div className="px-3 py-5 mb-2">
        <Link href={`/${locale}`} className="flex items-center gap-4">
          <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-violet-400">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </span>
          <span className="text-xl font-black tracking-tight text-violet-400 whitespace-nowrap overflow-hidden transition-all duration-300 w-0 opacity-0 group-hover:w-28 group-hover:opacity-100">
            Vibe
          </span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        <NavItem
          href={`/${locale}`}
          label="홈"
          active={pathname === `/${locale}` || pathname === `/${locale}/`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />
        <NavItem
          href={`/${locale}/explore`}
          label="탐색"
          active={isActive('/explore')}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
          }
        />
        {session && (
          <>
            <NavItem
              href={`/${locale}/feed`}
              label="피드"
              active={isActive('/feed')}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
            />
            <NavItem
              href={`/${locale}/playlist/new`}
              label="만들기"
              active={isActive('/playlist/new')}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            />
          </>
        )}
      </nav>

      {/* Bottom: profile / login */}
      <div className="px-2 pb-4 flex flex-col gap-1">
        {session ? (
          <>
            <NavItem
              href={`/${locale}/me`}
              label="프로필"
              active={isActive('/me')}
              icon={
                session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || ''}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )
              }
            />
            <button
              onClick={() => signOut()}
              className="flex items-center gap-4 px-3 py-3 rounded-xl text-zinc-500 hover:bg-zinc-800/70 hover:text-red-400 transition-all duration-200 w-full"
            >
              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 w-0 opacity-0 group-hover:w-28 group-hover:opacity-100">
                로그아웃
              </span>
            </button>
          </>
        ) : (
          <NavItem
            href={`/${locale}/login`}
            label="로그인"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            }
          />
        )}
      </div>
    </aside>
  )
}
