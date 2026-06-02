import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPlaylist extends Document {
  title: string
  description?: string
  coverUrl?: string
  isPublic: boolean
  userId: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const PlaylistSchema = new Schema<IPlaylist>(
  {
    title: { type: String, required: true },
    description: String,
    coverUrl: String,
    isPublic: { type: Boolean, default: true },
    userId: { type: String, required: true, index: true },
    tags: [{ type: String }],
  },
  { timestamps: true }
)

PlaylistSchema.index({ isPublic: 1, createdAt: -1 })
PlaylistSchema.index({ tags: 1 })

export const Playlist: Model<IPlaylist> =
  mongoose.models.Playlist || mongoose.model<IPlaylist>('Playlist', PlaylistSchema)
