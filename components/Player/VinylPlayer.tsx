'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useEffect, useRef, useState, useCallback } from 'react'
import { toggleLike } from '@/app/actions/playlist'
import { useTheme } from '@/components/ui/ThemeProvider'

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (event: { target: YTPlayer }) => void
            onStateChange?: (event: { data: number }) => void
          }
        }
      ) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  loadVideoById: (videoId: string) => void
  destroy: () => void
}

interface Track {
  id: string
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
  duration?: string | null
  order: number
}

interface VinylPlayerProps {
  tracks: Track[]
  currentIndex: number
  onIndexChange: (index: number) => void
  playlistId: string
  playlistTitle: string
  likeCount: number
  isLiked?: boolean
  isOwner?: boolean
}

export default function VinylPlayer({
  tracks,
  currentIndex,
  onIndexChange,
  playlistId,
  playlistTitle,
  likeCount: initialLikeCount,
  isLiked: initialIsLiked = false,
}: VinylPlayerProps) {
  const t = useTranslations('player')
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const playerRef = useRef<YTPlayer | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [apiReady, setApiReady] = useState(false)
  const playerReadyRef = useRef(false)

  const currentTrack = tracks[currentIndex]

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadAPI = () => {
      if (window.YT?.Player) {
        setApiReady(true)
        return
      }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
      window.onYouTubeIframeAPIReady = () => setApiReady(true)
    }

    loadAPI()
  }, [])

  // Initialize player when API is ready
  useEffect(() => {
    if (!apiReady || !currentTrack) return

    const playerId = 'yt-player-hidden'
    let div = document.getElementById(playerId)
    if (!div) {
      div = document.createElement('div')
      div.id = playerId
      div.style.display = 'none'
      document.body.appendChild(div)
    }

    if (playerRef.current) {
      playerRef.current.destroy()
    }

    playerRef.current = new window.YT.Player(playerId, {
      videoId: currentTrack.youtubeId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event) => {
          playerReadyRef.current = true
          setDuration(event.target.getDuration())
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true)
          } else if (
            event.data === window.YT.PlayerState.PAUSED ||
            event.data === window.YT.PlayerState.ENDED
          ) {
            setIsPlaying(false)
            if (event.data === window.YT.PlayerState.ENDED) {
              goNext()
            }
          }
        },
      },
    })

    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
      playerReadyRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady])

  // Load new video when currentIndex prop changes
  useEffect(() => {
    if (!playerRef.current || !tracks[currentIndex]) return
    playerRef.current.loadVideoById(tracks[currentIndex].youtubeId)
    setIsPlaying(true)
    setProgress(0)
    setCurrentTime(0)
  }, [currentIndex])

  // Timer for progress
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (playerRef.current) {
          const ct = playerRef.current.getCurrentTime()
          const dur = playerRef.current.getDuration()
          setCurrentTime(ct)
          setDuration(dur)
          setProgress(dur > 0 ? (ct / dur) * 100 : 0)
        }
      }, 500)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying])

  const togglePlay = useCallback(() => {
    if (!playerRef.current || !playerReadyRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const goNext = useCallback(() => {
    if (tracks.length === 0) return
    onIndexChange((currentIndex + 1) % tracks.length)
  }, [currentIndex, tracks, onIndexChange])

  const goPrev = useCallback(() => {
    if (tracks.length === 0) return
    onIndexChange((currentIndex - 1 + tracks.length) % tracks.length)
  }, [currentIndex, tracks, onIndexChange])

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!playerRef.current || !progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      const seekTime = ratio * duration
      playerRef.current.seekTo(seekTime, true)
      setProgress(ratio * 100)
    },
    [duration]
  )

  const handleLike = async () => {
    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikeCount((c) => c + (wasLiked ? -1 : 1))
    try {
      await toggleLike(playlistId)
    } catch {
      setIsLiked(wasLiked)
      setLikeCount((c) => c + (wasLiked ? 1 : -1))
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
        <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
        <p>{t('nowPlaying')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* LP Turntable Stage — intentionally stays dark (it's a turntable) */}
      <div className="relative w-72 h-72 select-none">
        {/* Turntable base */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-2xl border border-zinc-700" />

        {/* Vinyl grooves ring */}
        <div className="absolute inset-2 rounded-full border border-zinc-700/30" />
        <div className="absolute inset-4 rounded-full border border-zinc-700/20" />
        <div className="absolute inset-6 rounded-full border border-zinc-700/15" />

        {/* Album cover — LP shaped, rotating when playing */}
        <div
          className={`absolute inset-8 rounded-full overflow-hidden shadow-xl border-2 border-zinc-700 ${
            isPlaying ? 'lp-spin' : 'lp-spin-paused'
          }`}
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        >
          <Image
            src={currentTrack.thumbnailUrl}
            alt={currentTrack.title}
            fill
            className="object-cover"
          />
          {/* Center label */}
          <div className="absolute inset-[35%] rounded-full bg-zinc-900/90 border border-zinc-700 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
          </div>
        </div>

        {/* Needle arm */}
        <div
          className="absolute"
          style={{
            top: '-8px',
            right: '-8px',
            width: '120px',
            height: '120px',
          }}
        >
          <div
            className={`needle ${isPlaying ? 'playing' : ''}`}
            style={{
              width: '6px',
              height: '100px',
              background: isDark
                ? 'linear-gradient(to bottom, #e4e4e7, #a1a1aa)'
                : 'linear-gradient(to bottom, #52525b, #27272a)',
              borderRadius: '3px 3px 1px 1px',
              position: 'absolute',
              top: '16px',
              right: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.15)',
            }}
          >
            {/* Needle tip */}
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '3px',
                height: '8px',
                background: isDark ? '#d4d4d8' : '#3f3f46',
                borderRadius: '0 0 2px 2px',
              }}
            />
          </div>
          {/* Pivot point */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '12px',
              height: '12px',
              background: isDark ? '#e4e4e7' : '#52525b',
              borderRadius: '50%',
              border: isDark ? '2px solid #a1a1aa' : '2px solid #27272a',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          />
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
          {currentTrack.title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{currentTrack.artist}</p>
        <p className="text-xs text-zinc-500 mt-1">{playlistTitle}</p>
      </div>

      {/* Equalizer (only visible when playing) */}
      {isPlaying && (
        <div className="flex items-end gap-1 h-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="eq-bar w-1.5 bg-violet-400 rounded-sm"
              style={{ animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full max-w-sm space-y-1">
        <div
          ref={progressRef}
          onClick={seek}
          className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full cursor-pointer group"
        >
          <div
            className="h-full bg-violet-500 rounded-full relative transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-violet-400 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={goPrev}
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
          aria-label={t('prev')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
          className="w-14 h-14 bg-violet-600 hover:bg-violet-700 rounded-full flex items-center justify-center shadow-lg transition"
          aria-label={isPlaying ? t('pause') : t('play')}
        >
          {isPlaying ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={goNext}
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
          aria-label={t('next')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zm2-8.14 4.83 2.14L8 14.14V9.86zM16 6h2v12h-2z" />
          </svg>
        </button>

        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition ${
            isLiked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'
          }`}
          aria-label={isLiked ? t('unlike') : t('like')}
        >
          <svg
            className="w-5 h-5"
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="text-sm">{likeCount}</span>
        </button>
      </div>

      {/* Track position */}
      <p className="text-xs text-zinc-500">
        {currentIndex + 1} / {tracks.length}
      </p>
    </div>
  )
}
