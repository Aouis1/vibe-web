import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITrack extends Document {
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
  duration?: string
  order: number
  playlistId: string
}

const TrackSchema = new Schema<ITrack>({
  youtubeId: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  duration: String,
  order: { type: Number, required: true },
  playlistId: { type: String, required: true, index: true },
})

TrackSchema.index({ playlistId: 1, order: 1 })

export const Track: Model<ITrack> =
  mongoose.models.Track || mongoose.model<ITrack>('Track', TrackSchema)
