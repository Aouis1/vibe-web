import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PlaylistForm from '@/components/Playlist/PlaylistForm'
import { useTranslations } from 'next-intl'

export default async function NewPlaylistPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session) redirect(`/${locale}/login`)

  return <NewPlaylistContent />
}

function NewPlaylistContent() {
  const t = useTranslations('playlist')
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">{t('new')}</h1>
      <PlaylistForm />
    </div>
  )
}
