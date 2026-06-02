'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createPlaylist, updatePlaylist } from '@/app/actions/playlist'

interface PlaylistFormProps {
  playlist?: {
    id: string
    title: string
    description?: string | null
    isPublic: boolean
    tags: string[]
  }
}

export default function PlaylistForm({ playlist }: PlaylistFormProps) {
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
  const [error, setError] = useState('')

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
          await updatePlaylist(playlist.id, { title, description, isPublic, tags })
          router.push(`/${locale}/playlist/${playlist.id}`)
        } else {
          const created = await createPlaylist({ title, description, isPublic, tags })
          router.push(`/${locale}/playlist/${created.id}/edit`)
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

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          {t('titleLabel')} <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          maxLength={100}
          required
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          {t('descriptionLabel')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          maxLength={500}
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">{t('tagsLabel')}</label>
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
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPublic(true)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            isPublic ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          {t('isPublic')}
        </button>
        <button
          type="button"
          onClick={() => setIsPublic(false)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            !isPublic ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          {t('isPrivate')}
        </button>
      </div>

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
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium transition"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  )
}
