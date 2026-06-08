'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { deletePlaylist } from '@/app/actions/playlist'
import { useRouter } from 'next/navigation'

interface PlaylistDetailClientProps {
  playlist: {
    id: string
    title: string
    description?: string | null
    isPublic: boolean
    user: { id: string; name?: string | null; image?: string | null }
    tags: string[]
    createdAt: Date
  }
  isOwner: boolean
  locale: string
}

export default function PlaylistDetailClient({
  playlist,
  isOwner,
  locale,
}: PlaylistDetailClientProps) {
  const t = useTranslations('playlist')
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return
    setDeleting(true)
    try {
      await deletePlaylist(playlist.id)
    } catch {
      setDeleting(false)
    }
  }

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{playlist.title}</h1>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-xs transition"
            >
              {copied ? '✓' : 'Share'}
            </button>
            {isOwner && (
              <>
                <Link
                  href={`/${locale}/playlist/${playlist.id}/edit`}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-xs transition"
                >
                  {t('edit')}
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-400 rounded-full text-xs transition disabled:opacity-50"
                >
                  {deleting ? '...' : t('delete')}
                </button>
              </>
            )}
          </div>
        </div>

        {playlist.description && (
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2">{playlist.description}</p>
        )}

        <div className="flex items-center gap-3 mt-3">
          <Link
            href={`/${locale}/profile/${playlist.user.id}`}
            className="flex items-center gap-2 hover:text-violet-400 transition"
          >
            {playlist.user.image ? (
              <Image
                src={playlist.user.image}
                alt={playlist.user.name || ''}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs">
                {playlist.user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{playlist.user.name || 'Anonymous'}</span>
          </Link>
          <span className="text-zinc-400 dark:text-zinc-700">·</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            playlist.isPublic
              ? 'bg-green-900/30 text-green-400'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
          }`}>
            {playlist.isPublic ? t('isPublic') : t('isPrivate')}
          </span>
        </div>
      </div>

      {playlist.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {playlist.tags.map((tag) => (
            <Link
              key={tag}
              href={`/${locale}/explore?tag=${tag}`}
              className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-700 dark:hover:text-violet-300 px-3 py-1 rounded-full transition"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
