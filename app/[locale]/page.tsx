import { useTranslations } from 'next-intl'
import { connectDB } from '@/lib/mongodb'
import { Playlist } from '@/lib/models/Playlist'
import { Track } from '@/lib/models/Track'
import { Like } from '@/lib/models/Like'
import { User } from '@/lib/models/User'
import PlaylistCard from '@/components/Playlist/PlaylistCard'
import { auth } from '@/lib/auth'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return {
    title: locale === 'ko' ? 'Vibe — 음악 플레이리스트 SNS' : 'Vibe — Music Playlist SNS',
    description:
      locale === 'ko'
        ? '나만의 플레이리스트를 만들고 공유하세요'
        : 'Create and share your playlists',
  }
}

async function enrichPlaylists(rawPlaylists: any[]) {
  return Promise.all(
    rawPlaylists.map(async (pl) => {
      const id = pl._id.toString()
      const [user, tracks, likeCount, trackCount] = await Promise.all([
        User.findById(pl.userId).lean(),
        Track.find({ playlistId: id }).sort({ order: 1 }).limit(1).lean(),
        Like.countDocuments({ playlistId: id }),
        Track.countDocuments({ playlistId: id }),
      ])
      return {
        id,
        title: pl.title,
        description: pl.description ?? null,
        coverUrl: pl.coverUrl ?? null,
        isPublic: pl.isPublic,
        createdAt: pl.createdAt,
        user: user
          ? { id: (user as any)._id.toString(), name: (user as any).name ?? null, image: (user as any).image ?? null }
          : { id: pl.userId, name: null, image: null },
        tracks: tracks.map((t: any) => ({ thumbnailUrl: t.thumbnailUrl })),
        _count: { likes: likeCount, tracks: trackCount },
      }
    })
  )
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params
  await connectDB()

  // Fetch popular: sort by like count requires aggregation or separate sort after enrichment
  // We fetch candidates and enrich, then sort by likes
  const [popularRaw, latestRaw] = await Promise.all([
    Playlist.find({ isPublic: true }).sort({ createdAt: -1 }).limit(20).lean(),
    Playlist.find({ isPublic: true }).sort({ createdAt: -1 }).limit(9).lean(),
  ])

  const [enrichedForPopular, latest] = await Promise.all([
    enrichPlaylists(popularRaw),
    enrichPlaylists(latestRaw),
  ])

  const popular = enrichedForPopular
    .sort((a, b) => b._count.likes - a._count.likes)
    .slice(0, 6)

  const session = await auth()

  return <HomeContent popular={popular} latest={latest} userId={session?.user?.id} />
}

type PlaylistItem = {
  id: string
  title: string
  description?: string | null
  coverUrl?: string | null
  isPublic: boolean
  createdAt: Date
  user: { id: string; name?: string | null; image?: string | null }
  tracks: { thumbnailUrl: string }[]
  _count: { likes: number; tracks: number }
}

function HomeContent({
  popular,
  latest,
  userId,
}: {
  popular: PlaylistItem[]
  latest: PlaylistItem[]
  userId?: string
}) {
  const t = useTranslations('home')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-zinc-100">{t('popular')}</h2>
        {popular.length === 0 ? (
          <p className="text-zinc-500">{t('empty')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popular.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl as unknown as Parameters<typeof PlaylistCard>[0]['playlist']} currentUserId={userId} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 text-zinc-100">{t('latest')}</h2>
        {latest.length === 0 ? (
          <p className="text-zinc-500">{t('empty')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latest.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl as unknown as Parameters<typeof PlaylistCard>[0]['playlist']} currentUserId={userId} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
