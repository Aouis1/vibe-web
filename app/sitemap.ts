import { connectDB } from '@/lib/mongodb'
import { Playlist } from '@/lib/models/Playlist'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const locales = ['ko', 'en']

  const staticRoutes = locales.flatMap((locale) => [
    { url: `${baseUrl}/${locale}`, lastModified: new Date() },
    { url: `${baseUrl}/${locale}/explore`, lastModified: new Date() },
  ])

  await connectDB()

  const playlists = await Playlist.find({ isPublic: true })
    .select('_id updatedAt')
    .lean()

  const playlistRoutes = playlists.flatMap((playlist) => {
    const id = (playlist._id as any).toString()
    return locales.map((locale) => ({
      url: `${baseUrl}/${locale}/playlist/${id}`,
      lastModified: (playlist as any).updatedAt,
    }))
  })

  return [...staticRoutes, ...playlistRoutes]
}
