'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { createPlaylist, updatePlaylist } from '@/app/actions/playlist'

interface PlaylistFormProps {
  playlist?: {
    id: string
    title: string
    description?: string | null
    coverUrl?: string | null
    isPublic: boolean
    tags: string[]
  }
  onCreated?: (id: string) => void
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
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function PlaylistForm({ playlist, onCreated }: PlaylistFormProps) {
  const t = useTranslations('playlist')
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ko'
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState(playlist?.title || '')
  const [description, setDescription] = useState(playlist?.description || '')
  const [isPublic, setIsPublic] = useState(playlist?.isPublic ?? true)
  const [tags, setTags] = useState<string[]>(playlist?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(playlist?.coverUrl || null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      setCoverUrl(compressed)
    } catch {
      setError('이미지 처리 중 오류가 발생했어요')
    }
  }

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (!tags.includes(tag) && tags.length < 10) {
        setTags([...tags, tag])
      }
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    startTransition(async () => {
      try {
        if (playlist) {
          await updatePlaylist(playlist.id, {
            title,
            description,
            isPublic,
            tags,
            coverUrl: coverUrl ?? undefined,
          })
          router.push(`/${locale}/playlist/${playlist.id}`)
        } else {
          const created = await createPlaylist({
            title,
            description,
            isPublic,
            tags,
            coverUrl: coverUrl ?? undefined,
          })
          if (onCreated) {
            onCreated(created.id)
          } else {
            router.push(`/${locale}/playlist/${created.id}/edit`)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">커버 이미지</label>
        <div className="flex items-start gap-4">
          {/* Preview */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-32 h-32 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-500 transition flex-shrink-0 group"
          >
            {coverUrl ? (
              <>
                <Image src={coverUrl} alt="cover" fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="text-xs text-white font-medium">변경</span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-500 group-hover:text-violet-400 transition">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M12 3v9m0 0l-3-3m3 3l3-3" />
                </svg>
                <span className="text-xs">업로드</span>
              </div>
            )}
          </button>

          <div className="flex flex-col gap-2 pt-1">
            <p className="text-xs text-zinc-500 leading-relaxed">
              이미지를 선택하지 않으면<br />
              첫 번째 트랙 썸네일이 자동으로 표시돼요.
            </p>
            {coverUrl && (
              <button
                type="button"
                onClick={() => { setCoverUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className="text-xs text-red-400 hover:text-red-300 transition text-left"
              >
                이미지 제거
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          {t('titleLabel')} <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          maxLength={100}
          required
          className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          {t('descriptionLabel')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          maxLength={500}
          rows={3}
          className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t('tagsLabel')}</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-violet-900/50 text-violet-300 text-xs px-3 py-1 rounded-full"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-violet-400 hover:text-white ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder={t('tagsPlaceholder')}
          className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Public/Private */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPublic(true)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            isPublic ? 'bg-violet-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          {t('isPublic')}
        </button>
        <button
          type="button"
          onClick={() => setIsPublic(false)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            !isPublic ? 'bg-zinc-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          {t('isPrivate')}
        </button>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-sm font-medium transition"
        >
          {isPending ? '...' : t('save')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-sm font-medium transition"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  )
}
