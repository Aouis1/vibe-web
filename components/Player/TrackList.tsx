'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { removeTrack } from '@/app/actions/playlist'
import { useState } from 'react'

interface Track {
  id: string
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
  duration?: string | null
  order: number
}

interface TrackListProps {
  tracks: Track[]
  currentIndex: number
  onSelect: (index: number) => void
  isOwner?: boolean
  editable?: boolean
}

export default function TrackList({
  tracks,
  currentIndex,
  onSelect,
  isOwner,
  editable,
}: TrackListProps) {
  const t = useTranslations('playlist')
  const [removing, setRemoving] = useState<string | null>(null)

  const handleRemove = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation()
    setRemoving(trackId)
    try {
      await removeTrack(trackId)
    } finally {
      setRemoving(null)
    }
  }

  if (tracks.length === 0) {
    return <p className="text-zinc-500 text-sm py-4">{t('noTracks')}</p>
  }

  return (
    <div className="space-y-1">
      {tracks.map((track, index) => (
        <div
          key={track.id}
          onClick={() => onSelect(index)}
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
            index === currentIndex
              ? 'bg-violet-900/40 border border-violet-700/50'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span className="text-xs text-zinc-500 w-5 text-center">{index + 1}</span>
          <Image
            src={track.thumbnailUrl}
            alt={track.title}
            width={48}
            height={27}
            className="rounded object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${index === currentIndex ? 'text-violet-300' : 'text-zinc-900 dark:text-zinc-100'}`}>
              {track.title}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{track.artist}</p>
          </div>
          {track.duration && (
            <span className="text-xs text-zinc-500 flex-shrink-0">{track.duration}</span>
          )}
          {editable && isOwner && (
            <button
              onClick={(e) => handleRemove(e, track.id)}
              disabled={removing === track.id}
              className="p-1 text-zinc-400 dark:text-zinc-600 hover:text-red-400 transition flex-shrink-0"
            >
              {removing === track.id ? (
                <span className="text-xs">...</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
