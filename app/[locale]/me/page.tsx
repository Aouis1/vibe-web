import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { Playlist } from '@/lib/models/Playlist'
import { Track } from '@/lib/models/Track'
import { Like } from '@/lib/models/Like'
import { Follow } from '@/lib/models/Follow'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Profile' }

export default async function MePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  await connectDB()

  const rawUser = await User.findById(session.user.id).lean()
  if (!rawUser) redirect(`/${locale}/login`)

  const u = rawUser as any
  const userId = u._id.toString()

  const [rawPlaylists, followerCount, followingCount] = await Promise.all([
    Playlist.find({ userId }).sort({ createdAt: -1 }).lean(),
    Follow.countDocuments({ followingId: userId }),
    Follow.countDocuments({ followerId: userId }),
  ])

  const playlists = await Promise.all(
    rawPlaylists.map(async (pl) => {
      const plId = (pl._id as any).toString()
      const [likeCount, trackCount] = await Promise.all([
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
        _count: { likes: likeCount, tracks: trackCount },
      }
    })
  )

  const user = {
    id: userId,
    name: u.name ?? null,
    email: u.email,
    image: u.image ?? null,
    _count: {
      followers: followerCount,
      following: followingCount,
    },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-6 mb-10">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || ''}
            width={72}
            height={72}
            className="rounded-full"
          />
        ) : (
          <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{user.name || 'Anonymous'}</h1>
          <p className="text-zinc-500 text-sm">{user.email}</p>
          <div className="flex gap-4 mt-2 text-sm text-zinc-400">
            <span>{user._count.followers} followers</span>
            <span>{user._count.following} following</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Playlists</h2>
        <Link
          href={`/${locale}/playlist/new`}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-full text-sm font-medium transition"
        >
          + New
        </Link>
      </div>

      {playlists.length === 0 ? (
        <p className="text-zinc-500 py-8 text-center">No playlists yet. Create your first one!</p>
      ) : (
        <div className="space-y-3">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition"
            >
              <div>
                <Link
                  href={`/${locale}/playlist/${pl.id}`}
                  className="font-medium text-zinc-100 hover:text-violet-400 transition"
                >
                  {pl.title}
                </Link>
                <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                  <span>{pl._count.tracks} tracks</span>
                  <span>{pl._count.likes} likes</span>
                  <span className={pl.isPublic ? 'text-green-500' : 'text-zinc-600'}>
                    {pl.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
              <Link
                href={`/${locale}/playlist/${pl.id}/edit`}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs transition"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
