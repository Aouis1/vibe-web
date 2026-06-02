import { notFound, redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import { Playlist } from '@/lib/models/Playlist'
import { Track } from '@/lib/models/Track'
import { auth } from '@/lib/auth'
import PlaylistForm from '@/components/Playlist/PlaylistForm'
import YoutubeSearch from '@/components/Search/YoutubeSearch'
import EditableTrackList from '@/components/Player/EditableTrackList'

export default async function EditPlaylistPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const session = await auth()
  if (!session) redirect(`/${locale}/login`)

  await connectDB()

  const rawPlaylist = await Playlist.findById(id).lean()

  if (!rawPlaylist) notFound()

  const pl = rawPlaylist as any
  const playlistId = pl._id.toString()

  if (pl.userId !== session.user?.id) notFound()

  const rawTracks = await Track.find({ playlistId }).sort({ order: 1 }).lean()

  const playlist = {
    id: playlistId,
    title: pl.title,
    description: pl.description ?? null,
    coverUrl: pl.coverUrl ?? null,
    isPublic: pl.isPublic,
    tags: (pl.tags || []) as string[],
    createdAt: pl.createdAt,
    updatedAt: pl.updatedAt,
    tracks: rawTracks.map((t: any) => ({
      id: t._id.toString(),
      youtubeId: t.youtubeId,
      title: t.title,
      artist: t.artist,
      thumbnailUrl: t.thumbnailUrl,
      duration: t.duration ?? null,
      order: t.order,
      playlistId,
    })),
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      <section>
        <h1 className="text-2xl font-bold mb-8">Edit Playlist</h1>
        <PlaylistForm playlist={playlist} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Tracks</h2>
        <EditableTrackList tracks={playlist.tracks} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-zinc-200">Add Tracks</h2>
        <YoutubeSearch playlistId={playlist.id} />
      </section>
    </div>
  )
}
