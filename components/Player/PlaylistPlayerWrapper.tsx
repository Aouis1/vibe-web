'use client'

import { useState, useRef } from 'react'
import VinylPlayer from './VinylPlayer'
import { reorderTracks } from '@/app/actions/playlist'

interface Track {
  id: string
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
  duration?: string | null
  order: number
}

interface PlaylistPlayerWrapperProps {
  tracks: Track[]
  playlistId: string
  playlistTitle: string
  likeCount: number
  isLiked?: boolean
  isOwner?: boolean
  children?: React.ReactNode
}

export default function PlaylistPlayerWrapper({
  tracks: initialTracks,
  playlistId,
  playlistTitle,
  likeCount,
  isLiked,
  isOwner,
  children,
}: PlaylistPlayerWrapperProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tracks, setTracks] = useState(initialTracks)
  const [isDragging, setIsDragging] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)

  const handleDragStart = (index: number) => {
    dragIndex.current = index
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOverIndex.current = index
  }

  const handleDrop = async () => {
    if (dragIndex.current === null || dragOverIndex.current === null) return
    if (dragIndex.current === dragOverIndex.current) {
      setIsDragging(false)
      return
    }

    const newTracks = [...tracks]
    const [moved] = newTracks.splice(dragIndex.current, 1)
    newTracks.splice(dragOverIndex.current, 0, moved)
    setTracks(newTracks)

    // update currentIndex if the playing track moved
    if (currentIndex === dragIndex.current) {
      setCurrentIndex(dragOverIndex.current)
    } else if (
      currentIndex > dragIndex.current &&
      currentIndex <= dragOverIndex.current
    ) {
      setCurrentIndex(currentIndex - 1)
    } else if (
      currentIndex < dragIndex.current &&
      currentIndex >= dragOverIndex.current
    ) {
      setCurrentIndex(currentIndex + 1)
    }

    dragIndex.current = null
    dragOverIndex.current = null
    setIsDragging(false)

    // persist to DB
    try {
      await reorderTracks(playlistId, newTracks.map((t) => t.id))
    } catch (e) {
      console.error('Reorder failed', e)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Left: Vinyl Player */}
      <div>
        <VinylPlayer
          tracks={tracks}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          playlistId={playlistId}
          playlistTitle={playlistTitle}
          likeCount={likeCount}
          isLiked={isLiked}
          isOwner={isOwner}
        />
      </div>

      {/* Right: Info + Track list */}
      <div className="space-y-6">
        {children}

        <div>
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Tracks {isOwner && <span className="text-zinc-400 dark:text-zinc-600 font-normal normal-case ml-1">(drag to reorder)</span>}
          </h3>
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                draggable={isOwner}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={() => setIsDragging(false)}
                onClick={() => setCurrentIndex(index)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition select-none ${
                  index === currentIndex
                    ? 'bg-violet-900/40 border border-violet-700/50'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                } ${isDragging && dragOverIndex.current === index ? 'border-t-2 border-violet-400' : ''}`}
              >
                {isOwner && (
                  <div className="text-zinc-400 dark:text-zinc-600 cursor-grab active:cursor-grabbing flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                    </svg>
                  </div>
                )}
                <span className="text-xs text-zinc-500 w-5 text-center flex-shrink-0">{index + 1}</span>
                <img
                  src={track.thumbnailUrl}
                  alt={track.title}
                  width={48}
                  height={27}
                  className="rounded object-cover flex-shrink-0 w-12 h-7"
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
                {index === currentIndex && (
                  <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
                    {[1,2,3].map(i => (
                      <div
                        key={i}
                        className="w-1 bg-violet-400 rounded-sm eq-bar"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
