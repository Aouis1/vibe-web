'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toggleLike } from '@/app/actions/playlist'

interface FeedCardProps {
  playlist: {
    id: string
    title: string
    description?: string | null
    coverUrl?: string | null
    isPublic: boolean
    createdAt: Date
    tags?: string[]
    user: { id: string; name?: string | null; image?: string | null }
    tracks: { thumbnailUrl: string; title: string; artist: string }[]
    _count: { likes: number; tracks: number }
  }
  currentUserId?: string
  isLiked?: boolean
}

export default function FeedCard({
  playlist,
  currentUserId,
  isLiked: initialLiked = false,
}: FeedCardProps) {
  const params = useParams()
  const locale = (params?.locale as string) || 'ko'
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(playlist._count.likes)
  const [copied, setCopied] = useState(false)

  const coverImage = playlist.coverUrl || playlist.tracks[0]?.thumbnailUrl

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!currentUserId) return
    const prev = liked
    setLiked(!prev)
    setLikeCount(c => c + (prev ? -1 : 1))
    try { await toggleLike(playlist.id) } catch { setLiked(prev); setLikeCount(c => c + (prev ? 1 : -1)) }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    const url = `${window.location.origin}/${locale}/playlist/${playlist.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors">
      {/* Cover Image */}
      <Link href={`/${locale}/playlist/${playlist.id}`}>
        <div className="relative aspect-square bg-zinc-800 group">
          {coverImage ? (
            <Image src={coverImage} alt={playlist.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-900 to-zinc-900">
              <svg className="w-16 h-16 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100">
              <svg className="w-6 h-6 text-zinc-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          {/* Track count badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 rounded-full px-2 py-0.5 text-xs text-zinc-300">
            {playlist._count.tracks} tracks
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <Link href={`/${locale}/playlist/${playlist.id}`}>
              <h3 className="font-semibold text-zinc-100 truncate hover:text-violet-400 transition">
                {playlist.title}
              </h3>
            </Link>
            {playlist.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{playlist.description}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {playlist.tags && playlist.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {playlist.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[11px] bg-violet-900/30 text-violet-400 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* User */}
        <Link href={`/${locale}/profile/${playlist.user.id}`} className="flex items-center gap-2 mb-4 group">
          {playlist.user.image ? (
            <Image src={playlist.user.image} alt={playlist.user.name || ''} width={20} height={20} className="rounded-full" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold">
              {playlist.user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition">
            {playlist.user.name || 'Anonymous'}
          </span>
        </Link>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition ${liked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'}`}
            >
              <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{likeCount}</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="text-zinc-500 hover:text-zinc-300 transition"
              title="공유"
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>
          </div>

          {/* Track preview */}
          {playlist.tracks[0] && (
            <p className="text-xs text-zinc-600 truncate max-w-[120px]">
              {playlist.tracks[0].title}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
