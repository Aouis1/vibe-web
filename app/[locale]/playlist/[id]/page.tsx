import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import { Playlist } from '@/lib/models/Playlist'
import { Track } from '@/lib/models/Track'
import { Like } from '@/lib/models/Like'
import { User } from '@/lib/models/User'
import { auth } from '@/lib/auth'
import PlaylistPlayerWrapper from '@/components/Player/PlaylistPlayerWrapper'
import PlaylistDetailClient from './PlaylistDetailClient'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  await connectDB()
  const playlist = await Playlist.findById(id).lean()
  if (!playlist) return { title: 'Not Found' }
  return {
    title: (playlist as any).title,
    description: (playlist as any).description || undefined,
    openGraph: {
      title: (playlist as any).title,
      description: (playlist as any).description || undefined,
      images: (playlist as any).coverUrl ? [{ url: (playlist as any).coverUrl }] : [],
    },
  }
}

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id, locale } = await params
  const session = await auth()

  await connectDB()

  const rawPlaylist = await Playlist.findById(id).lean()

  if (!rawPlaylist) notFound()

  const pl = rawPlaylist as any
  const playlistId = pl._id.toString()

  if (!pl.isPublic && pl.userId !== session?.user?.id) {
    notFound()
  }

  const [user, tracks, likeCount] = await Promise.all([
    User.findById(pl.userId).lean(),
    Track.find({ playlistId }).sort({ order: 1 }).lean(),
    Like.countDocuments({ playlistId }),
  ])

  const isLiked = session?.user?.id
    ? !!(await Like.findOne({ userId: session.user.id, playlistId }))
    : false

  const isOwner = session?.user?.id === pl.userId

  const playlist = {
    id: playlistId,
    title: pl.title,
    description: pl.description ?? null,
    coverUrl: pl.coverUrl ?? null,
    isPublic: pl.isPublic,
    userId: pl.userId,
    tags: (pl.tags || []) as string[],
    createdAt: pl.createdAt,
    user: user
      ? { id: (user as any)._id.toString(), name: (user as any).name ?? null, image: (user as any).image ?? null }
      : { id: pl.userId, name: null, image: null },
    tracks: tracks.map((t: any) => ({
      id: t._id.toString(),
      youtubeId: t.youtubeId,
      title: t.title,
      artist: t.artist,
      thumbnailUrl: t.thumbnailUrl,
      duration: t.duration ?? null,
      order: t.order,
      playlistId,
    })),
    _count: { likes: likeCount },
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PlaylistPlayerWrapper
        tracks={playlist.tracks}
        playlistId={playlist.id}
        playlistTitle={playlist.title}
        likeCount={playlist._count.likes}
        isLiked={isLiked}
        isOwner={isOwner}
      >
        <PlaylistDetailClient
          playlist={{
            id: playlist.id,
            title: playlist.title,
            description: playlist.description,
            isPublic: playlist.isPublic,
            user: playlist.user,
            tags: playlist.tags,
            createdAt: playlist.createdAt,
          }}
          isOwner={isOwner}
          locale={locale}
        />
      </PlaylistPlayerWrapper>
    </div>
  )
}
