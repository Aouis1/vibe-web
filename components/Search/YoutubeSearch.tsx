'use client'

import { useTranslations } from 'next-intl'
import { useState, useCallback } from 'react'
import Image from 'next/image'
import { addTrack } from '@/app/actions/playlist'

interface SearchItem {
  id: string
  title: string
  artist: string
  thumbnailUrl: string
  duration: string
}

interface YoutubeSearchProps {
  playlistId: string
  onTrackAdded?: () => void
}

export default function YoutubeSearch({ playlistId, onTrackAdded }: YoutubeSearchProps) {
  const t = useTranslations('playlist')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  const search = useCallback(async (pageToken?: string) => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: query })
      if (pageToken) params.set('pageToken', pageToken)
      const res = await fetch(`/api/youtube/search?${params}`)
      const data = await res.json()
      if (pageToken) {
        setResults((prev) => [...prev, ...(data.items || [])])
      } else {
        setResults(data.items || [])
      }
      setNextPageToken(data.nextPageToken)
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleAdd = async (item: SearchItem) => {
    setAdding(item.id)
    try {
      await addTrack(playlistId, {
        youtubeId: item.id,
        title: item.title,
        artist: item.artist,
        thumbnailUrl: item.thumbnailUrl,
        duration: item.duration,
      })
      onTrackAdded?.()
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder={t('searchYoutubePlaceholder')}
          className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={() => search()}
          disabled={loading}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-sm font-medium transition text-white"
        >
          {loading ? '...' : t('searchYoutube')}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Image
                src={item.thumbnailUrl}
                alt={item.title}
                width={80}
                height={45}
                className="rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.title}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{item.artist}</p>
                {item.duration && <p className="text-xs text-zinc-500">{item.duration}</p>}
              </div>
              <button
                onClick={() => handleAdd(item)}
                disabled={adding === item.id}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-full text-xs font-medium transition flex-shrink-0 text-white"
              >
                {adding === item.id ? '...' : t('addToPlaylist')}
              </button>
            </div>
          ))}
          {nextPageToken && (
            <button
              onClick={() => search(nextPageToken)}
              disabled={loading}
              className="w-full py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
            >
              {t('loadMore', { ns: 'common' })}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
