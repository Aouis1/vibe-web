import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFollow extends Document {
  followerId: string
  followingId: string
  createdAt: Date
}

const FollowSchema = new Schema<IFollow>(
  {
    followerId: { type: String, required: true },
    followingId: { type: String, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true })
FollowSchema.index({ followingId: 1 })

export const Follow: Model<IFollow> =
  mongoose.models.Follow || mongoose.model<IFollow>('Follow', FollowSchema)
