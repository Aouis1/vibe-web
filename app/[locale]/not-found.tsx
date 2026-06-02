import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function NotFound() {
  const t = useTranslations('common')

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-8xl font-black text-zinc-700">404</div>
      <p className="text-xl text-zinc-400">{t('notFound')}</p>
      <Link
        href="/"
        className="px-6 py-2 bg-violet-600 hover:bg-violet-700 rounded-full text-sm font-medium transition"
      >
        {t('goHome')}
      </Link>
    </div>
  )
}
