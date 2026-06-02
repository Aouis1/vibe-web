import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import { Playlist } from '@/lib/models/Playlist'
import { Track } from '@/lib/models/Track'
import { Like } from '@/lib/models/Like'
import { User } from '@/lib/models/User'
import FeedCard from '@/components/Playlist/FeedCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Feed' }

async function enrichPlaylists(rawPlaylists: any[]) {
  return Promise.all(
    rawPlaylists.map(async (pl) => {
      const id = pl._id.toString()
      const [user, tracks, likeCount, trackCount] = await Promise.all([
        User.findById(pl.userId).lean(),
        Track.find({ playlistId: id }).sort({ order: 1 }).limit(3).lean(),
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
        tags: (pl.tags || []) as string[],
        user: user
          ? { id: (user as any)._id.toString(), name: (user as any).name ?? null, image: (user as any).image ?? null }
          : { id: pl.userId, name: null, image: null },
        tracks: tracks.map((t: any) => ({ thumbnailUrl: t.thumbnailUrl, title: t.title, artist: t.artist })),
        _count: { likes: likeCount, tracks: trackCount },
      }
    })
  )
}

export default async function FeedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  await connectDB()

  const rawPlaylists = await Playlist.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean()

  const enriched = await enrichPlaylists(rawPlaylists)
  const playlists = enriched
    .sort((a, b) => b._count.likes - a._count.likes)
    .slice(0, 18)

  const likedDocs = await Like.find({ userId: session.user.id }).select('playlistId').lean()
  const likedIds = likedDocs.map((l: any) => l.playlistId)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">인기 피드</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((pl) => (
          <FeedCard
            key={pl.id}
            playlist={pl}
            currentUserId={session.user?.id}
            isLiked={likedIds.includes(pl.id)}
          />
        ))}
      </div>
    </div>
  )
}
