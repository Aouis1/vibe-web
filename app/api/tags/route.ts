import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Playlist } from '@/lib/models/Playlist'

export async function GET() {
  await connectDB()

  const tagAgg = await Playlist.aggregate([
    { $match: { isPublic: true } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 30 },
  ])

  const tags = tagAgg.map((t) => ({
    id: t._id,
    name: t._id,
    count: t.count,
  }))

  return NextResponse.json(tags)
}
