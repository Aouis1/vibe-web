'use client'

import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Playlist {
  id: string
  title: string
  description?: string | null
  coverUrl?: string | null
  isPublic: boolean
  createdAt: Date
  user: { id: string; name?: string | null; image?: string | null }
  tracks: { thumbnailUrl: string }[]
  tags?: string[]
  _count: { likes: number; tracks: number }
}

interface Tag {
  id: string
  name: string
  _count: { playlists: number }
}

interface ExploreClientProps {
  playlists: Playlist[]
  allTags: Tag[]
  currentUserId?: string
  initialQ?: string
  initialTag?: string
}

export default function ExploreClient({
  playlists,
  allTags,
  currentUserId,
  initialQ,
  initialTag,
}: ExploreClientProps) {
  const t = useTranslations('explore')
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ko'
  const [search, setSearch] = useState(initialQ || '')

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const url = new URL(window.location.href)
      if (search.trim()) {
        url.searchParams.set('q', search.trim())
      } else {
        url.searchParams.delete('q')
      }
      url.searchParams.delete('tag')
      router.push(url.pathname + url.search)
    },
    [search, router]
  )

  const selectTag = useCallback(
    (tagName: string) => {
      const url = new URL(window.location.href)
      if (initialTag === tagName) {
        url.searchParams.delete('tag')
      } else {
        url.searchParams.set('tag', tagName)
      }
      url.searchParams.delete('q')
      router.push(url.pathname + url.search)
    },
    [initialTag, router]
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">{t('title')}</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="flex-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 text-sm"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium text-white transition"
        >
          검색
        </button>
      </form>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => selectTag(tag.name)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                initialTag === tag.name
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              #{tag.name}
              <span className="ml-1 opacity-60">({tag._count.playlists})</span>
            </button>
          ))}
        </div>
      )}

      {/* Table header */}
      {playlists.length > 0 && (
        <div className="grid grid-cols-[40px_1fr_auto] sm:grid-cols-[40px_1fr_140px_60px] gap-x-4 px-3 mb-2 text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          <span></span>
          <span>제목</span>
          <span className="hidden sm:block">만든이</span>
          <span className="text-right">곡 수</span>
        </div>
      )}

      {/* Playlist rows */}
      {playlists.length === 0 ? (
        <p className="text-zinc-500 text-center py-16">{t('noResults')}</p>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {playlists.map((pl, idx) => {
            const thumb = pl.coverUrl || pl.tracks[0]?.thumbnailUrl
            return (
              <Link
                key={pl.id}
                href={`/${locale}/playlist/${pl.id}`}
                className="grid grid-cols-[40px_1fr_auto] sm:grid-cols-[40px_1fr_140px_60px] gap-x-4 items-center px-3 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition group"
              >
                {/* Thumbnail */}
                <div className="relative w-10 h-10 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={pl.title}
                      fill
                      className="object-cover"
                      unoptimized={thumb.startsWith('data:')}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-zinc-900 flex items-center justify-center">
                      <svg className="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Title + tags */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-violet-400 transition">
                    {pl.title}
                  </p>
                  {pl.tags && pl.tags.length > 0 && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                      {pl.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                    </p>
                  )}
                </div>

                {/* User */}
                <div className="hidden sm:flex items-center gap-2 min-w-0">
                  {pl.user.image ? (
                    <Image
                      src={pl.user.image}
                      alt={pl.user.name || ''}
                      width={20}
                      height={20}
                      className="rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-violet-700 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                      {pl.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-xs text-zinc-500 truncate">{pl.user.name || 'Anonymous'}</span>
                </div>

                {/* Track count */}
                <div className="text-right text-xs text-zinc-400 dark:text-zinc-500">
                  {pl._count.tracks}곡
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
