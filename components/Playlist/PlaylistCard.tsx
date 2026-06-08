'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toggleLike } from '@/app/actions/playlist'

interface PlaylistCardProps {
  playlist: {
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
  currentUserId?: string
  liked?: boolean
}

export default function PlaylistCard({ playlist, currentUserId, liked: initialLiked = false }: PlaylistCardProps) {
  const t = useTranslations('playlist')
  const params = useParams()
  const locale = (params?.locale as string) || 'ko'
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(playlist._count.likes)

  const coverImage = playlist.coverUrl || playlist.tracks[0]?.thumbnailUrl

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!currentUserId) return
    const wasLiked = liked
    setLiked(!liked)
    setLikeCount((c) => c + (wasLiked ? -1 : 1))
    try {
      await toggleLike(playlist.id)
    } catch {
      setLiked(wasLiked)
      setLikeCount((c) => c + (wasLiked ? 1 : -1))
    }
  }

  return (
    <Link href={`/${locale}/playlist/${playlist.id}`} className="block group">
      <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
        <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={playlist.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-900 to-zinc-900">
              <svg className="w-12 h-12 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-0.5 text-xs text-zinc-300">
            {playlist._count.tracks} tracks
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-violet-400 transition">
            {playlist.title}
          </h3>
          {playlist.description && (
            <p className="text-sm text-zinc-500 mt-1 truncate">{playlist.description}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-zinc-500">
              {t('by')} {playlist.user.name || 'Anonymous'}
            </span>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs transition ${
                liked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likeCount}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
