'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createPlaylistWithTracks } from '@/app/actions/playlist'

interface PendingTrack {
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
  duration: string
}

interface SearchResult {
  id: string
  title: string
  artist: string
  thumbnailUrl: string
  duration: string
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 600
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function NewPlaylistPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) || 'ko'
  const [isPending, startTransition] = useTransition()

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Search
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  // Pending tracks (queued before save)
  const [pendingTracks, setPendingTracks] = useState<PendingTrack[]>([])

  const [error, setError] = useState('')

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { setCoverUrl(await compressImage(file)) }
    catch { setError('이미지 처리 중 오류가 발생했어요') }
  }

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (!tags.includes(tag) && tags.length < 10) setTags([...tags, tag])
      setTagInput('')
    }
  }

  const search = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(data.items || [])
    } finally {
      setSearching(false)
    }
  }, [query])

  const addToQueue = (item: SearchResult) => {
    if (addedIds.has(item.id)) return
    setPendingTracks(prev => [...prev, {
      youtubeId: item.id,
      title: item.title,
      artist: item.artist,
      thumbnailUrl: item.thumbnailUrl,
      duration: item.duration,
    }])
    setAddedIds(prev => new Set(prev).add(item.id))
  }

  const removeFromQueue = (youtubeId: string) => {
    setPendingTracks(prev => prev.filter(t => t.youtubeId !== youtubeId))
    setAddedIds(prev => { const s = new Set(prev); s.delete(youtubeId); return s })
  }

  const handleSubmit = () => {
    if (!title.trim()) { setError('제목을 입력해 주세요'); return }
    setError('')
    startTransition(async () => {
      try {
        const created = await createPlaylistWithTracks(
          { title, description, isPublic, tags, coverUrl: coverUrl ?? undefined },
          pendingTracks
        )
        router.push(`/${locale}/playlist/${created.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했어요')
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">새 플레이리스트</h1>

      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── LEFT: 플레이리스트 정보 ── */}
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">플레이리스트 정보</h2>

          {/* Cover */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">커버 이미지</label>
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 rounded-xl overflow-hidden bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-violet-500 transition flex-shrink-0 group"
              >
                {coverUrl ? (
                  <>
                    <Image src={coverUrl} alt="cover" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-xs text-white">변경</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-zinc-500 group-hover:text-violet-400 transition">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M12 3v9m0 0l-3-3m3 3l3-3" />
                    </svg>
                    <span className="text-xs">업로드</span>
                  </div>
                )}
              </button>
              <div className="pt-1">
                <p className="text-xs text-zinc-500 leading-relaxed">미설정 시 첫 트랙<br />썸네일이 자동 표시돼요.</p>
                {coverUrl && (
                  <button type="button" onClick={() => { setCoverUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-xs text-red-400 hover:text-red-300 mt-2 block">제거</button>
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">제목 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="플레이리스트 이름"
              maxLength={100}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">설명</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="플레이리스트를 설명해 주세요"
              maxLength={500}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">태그</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-violet-900/50 text-violet-300 text-xs px-3 py-1 rounded-full">
                  #{tag}
                  <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="text-violet-400 hover:text-white ml-1">×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="태그 입력 후 Enter"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Public toggle */}
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsPublic(true)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${isPublic ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>공개</button>
            <button type="button" onClick={() => setIsPublic(false)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${!isPublic ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>비공개</button>
          </div>

          {/* Queued tracks preview */}
          {pendingTracks.length > 0 && (
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-2">추가할 트랙 ({pendingTracks.length})</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {pendingTracks.map((t, i) => (
                  <div key={t.youtubeId} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/60">
                    <span className="text-xs text-zinc-500 w-4">{i + 1}</span>
                    <Image src={t.thumbnailUrl} alt={t.title} width={36} height={36} className="rounded object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-100 truncate">{t.title}</p>
                      <p className="text-[11px] text-zinc-400">{t.artist}</p>
                    </div>
                    <button type="button" onClick={() => removeFromQueue(t.youtubeId)} className="text-zinc-500 hover:text-red-400 transition text-sm">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !title.trim()}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-sm font-medium transition"
            >
              {isPending ? '저장 중...' : `저장${pendingTracks.length > 0 ? ` (트랙 ${pendingTracks.length}개 포함)` : ''}`}
            </button>
            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium transition">취소</button>
          </div>
        </div>

        {/* ── RIGHT: 노래 추가 ── */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">노래 추가</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="곡 이름이나 아티스트 검색..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={search}
              disabled={searching}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
            >
              {searching ? '...' : '검색'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {searchResults.map(item => {
                const added = addedIds.has(item.id)
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/60 transition">
                    <Image src={item.thumbnailUrl} alt={item.title} width={72} height={40} className="rounded object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">{item.title}</p>
                      <p className="text-xs text-zinc-400">{item.artist}</p>
                      {item.duration && <p className="text-xs text-zinc-500">{item.duration}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => addToQueue(item)}
                      disabled={added}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex-shrink-0 ${
                        added
                          ? 'bg-zinc-700 text-zinc-500 cursor-default'
                          : 'bg-violet-600 hover:bg-violet-700 text-white'
                      }`}
                    >
                      {added ? '추가됨' : '추가'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
