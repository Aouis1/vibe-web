'use client'

import { useTranslations } from 'next-intl'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import PlaylistCard from '@/components/Playlist/PlaylistCard'

interface Playlist {
  id: string
  title: string
  description?: string | null
  coverUrl?: string | null
  isPublic: boolean
  createdAt: Date
  user: { id: string; name?: string | null; image?: string | null }
  tracks: { thumbnailUrl: string }[]
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition"
        >
          Search
        </button>
      </form>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => selectTag(tag.name)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                initialTag === tag.name
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              #{tag.name}
              <span className="ml-1 text-zinc-500">({tag._count.playlists})</span>
            </button>
          ))}
        </div>
      )}

      {playlists.length === 0 ? (
        <p className="text-zinc-500 text-center py-16">{t('noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((pl) => (
            <PlaylistCard key={pl.id} playlist={pl} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
