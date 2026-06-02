'use server'

import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { Playlist } from '@/lib/models/Playlist'
import { Track } from '@/lib/models/Track'
import { Like } from '@/lib/models/Like'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const PlaylistSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
})

const TrackSchema = z.object({
  youtubeId: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  thumbnailUrl: z.string().url(),
  duration: z.string().optional(),
})

export async function createPlaylist(data: z.infer<typeof PlaylistSchema>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const validated = PlaylistSchema.parse(data)

  await connectDB()
  const playlist = await Playlist.create({
    title: validated.title,
    description: validated.description,
    isPublic: validated.isPublic,
    userId: session.user.id,
    tags: validated.tags ?? [],
  })

  revalidatePath('/ko')
  revalidatePath('/en')
  return { id: playlist._id.toString() }
}

export async function updatePlaylist(id: string, data: Partial<z.infer<typeof PlaylistSchema>>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await connectDB()
  const playlist = await Playlist.findById(id)
  if (!playlist || playlist.userId !== session.user.id) throw new Error('Forbidden')

  if (data.title !== undefined) playlist.title = data.title
  if (data.description !== undefined) playlist.description = data.description
  if (data.isPublic !== undefined) playlist.isPublic = data.isPublic
  if (data.tags !== undefined) playlist.tags = data.tags
  await playlist.save()

  revalidatePath(`/ko/playlist/${id}`)
  revalidatePath(`/en/playlist/${id}`)
  return { id }
}

export async function deletePlaylist(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await connectDB()
  const playlist = await Playlist.findById(id)
  if (!playlist || playlist.userId !== session.user.id) throw new Error('Forbidden')

  await Promise.all([
    Playlist.findByIdAndDelete(id),
    Track.deleteMany({ playlistId: id }),
    Like.deleteMany({ playlistId: id }),
  ])

  revalidatePath('/ko')
  revalidatePath('/en')
  redirect('/ko')
}

export async function toggleLike(playlistId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await connectDB()
  const existing = await Like.findOne({ userId: session.user.id, playlistId })

  if (existing) {
    await Like.findByIdAndDelete(existing._id)
  } else {
    await Like.create({ userId: session.user.id, playlistId })
  }

  revalidatePath(`/ko/playlist/${playlistId}`)
  revalidatePath(`/en/playlist/${playlistId}`)
  revalidatePath('/ko/feed')
  revalidatePath('/en/feed')
  return !existing
}

export async function addTrack(playlistId: string, trackData: z.infer<typeof TrackSchema>) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await connectDB()
  const playlist = await Playlist.findById(playlistId)
  if (!playlist || playlist.userId !== session.user.id) throw new Error('Forbidden')

  const validated = TrackSchema.parse(trackData)
  const count = await Track.countDocuments({ playlistId })

  const track = await Track.create({ ...validated, order: count, playlistId })

  revalidatePath(`/ko/playlist/${playlistId}`)
  revalidatePath(`/en/playlist/${playlistId}`)
  return { id: track._id.toString() }
}

export async function removeTrack(trackId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await connectDB()
  const track = await Track.findById(trackId)
  if (!track) throw new Error('Not found')

  const playlist = await Playlist.findById(track.playlistId)
  if (!playlist || playlist.userId !== session.user.id) throw new Error('Forbidden')

  await Track.findByIdAndDelete(trackId)

  revalidatePath(`/ko/playlist/${track.playlistId}`)
  revalidatePath(`/en/playlist/${track.playlistId}`)
}

export async function reorderTracks(playlistId: string, trackIds: string[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await connectDB()
  const playlist = await Playlist.findById(playlistId)
  if (!playlist || playlist.userId !== session.user.id) throw new Error('Forbidden')

  await Promise.all(
    trackIds.map((id, index) =>
      Track.findByIdAndUpdate(id, { order: index })
    )
  )

  revalidatePath(`/ko/playlist/${playlistId}`)
  revalidatePath(`/en/playlist/${playlistId}`)
}
