import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILike extends Document {
  userId: string
  playlistId: string
  createdAt: Date
}

const LikeSchema = new Schema<ILike>(
  {
    userId: { type: String, required: true },
    playlistId: { type: String, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

LikeSchema.index({ userId: 1, playlistId: 1 }, { unique: true })
LikeSchema.index({ playlistId: 1 })

export const Like: Model<ILike> =
  mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema)
