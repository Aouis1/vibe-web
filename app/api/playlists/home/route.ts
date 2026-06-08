import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Playlist } from '@/lib/models/Playlist'
import { Track } from '@/lib/models/Track'
import { Like } from '@/lib/models/Like'
import { User } from '@/lib/models/User'

export async function GET() {
  await connectDB()

  const raws = await Playlist.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean()

  const playlists = await Promise.all(
    raws.map(async (pl: any) => {
      const id = pl._id.toString()
      const [user, firstTrack, likeCount, trackCount] = await Promise.all([
        User.findById(pl.userId).lean() as any,
        Track.findOne({ playlistId: id }).sort({ order: 1 }).lean() as any,
        Like.countDocuments({ playlistId: id }),
        Track.countDocuments({ playlistId: id }),
      ])
      return {
        id,
        title: pl.title,
        description: pl.description ?? null,
        coverUrl: pl.coverUrl ?? null,
        isPublic: pl.isPublic,
        tags: pl.tags || [],
        user: user
          ? { id: user._id.toString(), name: user.name ?? null, image: user.image ?? null }
          : { id: pl.userId, name: null, image: null },
        firstThumb: firstTrack?.thumbnailUrl ?? null,
        likeCount,
        trackCount,
      }
    })
  )

  return NextResponse.json(playlists)
}
