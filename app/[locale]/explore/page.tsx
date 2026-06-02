import { connectDB } from '@/lib/mongodb'
import { Playlist } from '@/lib/models/Playlist'
import { Track } from '@/lib/models/Track'
import { Like } from '@/lib/models/Like'
import { User } from '@/lib/models/User'
import { auth } from '@/lib/auth'
import ExploreClient from './ExploreClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Explore' }

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; tag?: string }>
}) {
  const { q, tag } = await searchParams
  const session = await auth()

  await connectDB()

  // Build query filter
  const filter: Record<string, any> = { isPublic: true }
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
    ]
  }
  if (tag) {
    filter.tags = tag
  }

  const rawPlaylists = await Playlist.find(filter).sort({ createdAt: -1 }).limit(24).lean()

  const playlists = await Promise.all(
    rawPlaylists.map(async (pl) => {
      const id = (pl._id as any).toString()
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

  // Build tags list from all public playlists using aggregation
  const tagAgg = await Playlist.aggregate([
    { $match: { isPublic: true } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 30 },
  ])

  const allTags = tagAgg.map((t) => ({
    id: t._id as string,
    name: t._id as string,
    _count: { playlists: t.count as number },
  }))

  return (
    <ExploreClient
      playlists={playlists}
      allTags={allTags}
      currentUserId={session?.user?.id}
      initialQ={q}
      initialTag={tag}
    />
  )
}
