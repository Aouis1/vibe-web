import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { Playlist } from '@/lib/models/Playlist'
import { Track } from '@/lib/models/Track'
import { Like } from '@/lib/models/Like'
import { Follow } from '@/lib/models/Follow'
import { auth } from '@/lib/auth'
import Image from 'next/image'
import PlaylistCard from '@/components/Playlist/PlaylistCard'
import FollowButton from './FollowButton'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  await connectDB()
  const user = await User.findById(id).lean()
  return { title: (user as any)?.name || 'Profile' }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const session = await auth()

  await connectDB()

  const rawUser = await User.findById(id).lean()
  if (!rawUser) notFound()

  const u = rawUser as any
  const userId = u._id.toString()

  const [rawPlaylists, followerCount, followingCount, playlistCount] = await Promise.all([
    Playlist.find({ userId, isPublic: true }).sort({ createdAt: -1 }).limit(12).lean(),
    Follow.countDocuments({ followingId: userId }),
    Follow.countDocuments({ followerId: userId }),
    Playlist.countDocuments({ userId }),
  ])

  const playlists = await Promise.all(
    rawPlaylists.map(async (pl) => {
      const plId = (pl._id as any).toString()
      const [user, tracks, likeCount, trackCount] = await Promise.all([
        Promise.resolve({ id: userId, name: u.name ?? null, image: u.image ?? null }),
        Track.find({ playlistId: plId }).sort({ order: 1 }).limit(1).lean(),
        Like.countDocuments({ playlistId: plId }),
        Track.countDocuments({ playlistId: plId }),
      ])
      return {
        id: plId,
        title: pl.title,
        description: pl.description ?? null,
        coverUrl: pl.coverUrl ?? null,
        isPublic: pl.isPublic,
        createdAt: pl.createdAt,
        user,
        tracks: tracks.map((t: any) => ({ thumbnailUrl: t.thumbnailUrl })),
        _count: { likes: likeCount, tracks: trackCount },
      }
    })
  )

  const isOwnProfile = session?.user?.id === userId
  const isFollowing = session?.user?.id
    ? !!(await Follow.findOne({ followerId: session.user.id, followingId: userId }))
    : false

  const user = {
    id: userId,
    name: u.name ?? null,
    email: u.email,
    image: u.image ?? null,
    _count: {
      playlists: playlistCount,
      followers: followerCount,
      following: followingCount,
    },
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || ''}
            width={80}
            height={80}
            className="rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-zinc-100">{user.name || 'Anonymous'}</h1>
          <p className="text-sm text-zinc-500 mt-1">{user.email}</p>

          <div className="flex justify-center sm:justify-start gap-6 mt-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-zinc-100">{user._count.playlists}</div>
              <div className="text-zinc-500">Playlists</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-zinc-100">{user._count.followers}</div>
              <div className="text-zinc-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-zinc-100">{user._count.following}</div>
              <div className="text-zinc-500">Following</div>
            </div>
          </div>

          {!isOwnProfile && session && (
            <div className="mt-4">
              <FollowButton
                targetUserId={user.id}
                isFollowing={isFollowing}
              />
            </div>
          )}
        </div>
      </div>

      {/* Playlists */}
      <h2 className="text-xl font-semibold mb-4">Playlists</h2>
      {playlists.length === 0 ? (
        <p className="text-zinc-500">No public playlists yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((pl) => (
            <PlaylistCard
              key={pl.id}
              playlist={pl as Parameters<typeof PlaylistCard>[0]['playlist']}
              currentUserId={session?.user?.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
