import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  name?: string
  email: string
  emailVerified?: Date
  image?: string
  password?: string
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    emailVerified: Date,
    image: String,
    password: String,
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
