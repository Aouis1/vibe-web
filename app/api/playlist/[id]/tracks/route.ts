import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Track } from '@/lib/models/Track'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const tracks = await Track.find({ playlistId: id }).sort({ order: 1 }).lean()
  return NextResponse.json(
    tracks.map((t: any) => ({
      id: t._id.toString(),
      youtubeId: t.youtubeId,
      title: t.title,
      artist: t.artist,
      thumbnailUrl: t.thumbnailUrl,
      duration: t.duration ?? null,
      order: t.order,
      playlistId: t.playlistId,
    }))
  )
}
