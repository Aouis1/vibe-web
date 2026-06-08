import Link from 'next/link'
import Image from 'next/image'
import { connectDB } from '@/lib/mongodb'
import { Playlist } from '@/lib/models/Playlist'
import { Track } from '@/lib/models/Track'
import { Like } from '@/lib/models/Like'
import { User } from '@/lib/models/User'
import { auth } from '@/lib/auth'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ko' ? 'Vibe — 음악 플레이리스트 SNS' : 'Vibe — Music Playlist SNS',
  }
}

type PlaylistItem = {
  id: string
  title: string
  coverUrl: string | null
  user: { id: string; name: string | null; image: string | null }
  firstThumb: string | null
  likeCount: number
  trackCount: number
  createdAt: Date
}

async function getPlaylists(): Promise<PlaylistItem[]> {
  const raws = await Playlist.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean()

  return Promise.all(
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
        coverUrl: pl.coverUrl ?? null,
        user: user
          ? { id: user._id.toString(), name: user.name ?? null, image: user.image ?? null }
          : { id: pl.userId, name: null, image: null },
        firstThumb: firstTrack?.thumbnailUrl ?? null,
        likeCount,
        trackCount,
        createdAt: pl.createdAt,
      }
    })
  )
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await connectDB()

  const session = await auth()
  const all = await getPlaylists()

  // Top 2 by likes → featured
  const featured = [...all].sort((a, b) => b.likeCount - a.likeCount).slice(0, 2)
  // Rest as list (latest order, skip featured)
  const featuredIds = new Set(featured.map((p) => p.id))
  const list = all.filter((p) => !featuredIds.has(p.id)).slice(0, 20)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* ── Featured ── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-5">인기 플레이리스트</h2>
        {featured.length === 0 ? (
          <p className="text-zinc-500 text-sm">아직 플레이리스트가 없어요</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featured.map((pl) => {
              const thumb = pl.coverUrl || pl.firstThumb
              return (
                <Link
                  key={pl.id}
                  href={`/${locale}/playlist/${pl.id}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[16/9] bg-zinc-800 block"
                >
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={pl.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      unoptimized={thumb.startsWith('data:')}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-zinc-900 flex items-center justify-center">
                      <svg className="w-16 h-16 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  )}
                  {/* Gradient overlay — always dark since it's over an image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Text */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
                      인기
                    </p>
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 group-hover:text-violet-300 transition">
                      {pl.title}
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">{pl.user.name || 'Anonymous'}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Playlist List ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">최신 플레이리스트</h2>
          <Link href={`/${locale}/explore`} className="text-sm text-violet-400 hover:text-violet-300 transition">
            전체 보기 →
          </Link>
        </div>

        {list.length === 0 ? (
          <p className="text-zinc-500 text-sm">아직 플레이리스트가 없어요</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
            {list.map((pl) => {
              const thumb = pl.coverUrl || pl.firstThumb
              return (
                <Link
                  key={pl.id}
                  href={`/${locale}/playlist/${pl.id}`}
                  className="flex items-center gap-3 py-3 group border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 rounded-lg px-2 -mx-2 transition"
                >
                  {/* Thumbnail */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={pl.title}
                        fill
                        className="object-cover"
                        unoptimized={thumb.startsWith('data:')}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-zinc-900 flex items-center justify-center">
                        <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Title + track count */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-violet-300 transition">
                      {pl.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{pl.trackCount}곡</p>
                  </div>

                  {/* User avatar */}
                  <div className="flex-shrink-0">
                    {pl.user.image ? (
                      <Image
                        src={pl.user.image}
                        alt={pl.user.name || ''}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-[11px] font-bold text-white">
                        {pl.user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
