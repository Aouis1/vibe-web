'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('common')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-2xl font-bold text-red-400">{t('error')}</h2>
      <p className="text-zinc-400 text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-violet-600 hover:bg-violet-700 rounded-full text-sm font-medium transition"
      >
        {t('retry')}
      </button>
    </div>
  )
}
