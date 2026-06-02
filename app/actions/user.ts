'use server'

import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { Follow } from '@/lib/models/Follow'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const SignupSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function signup(data: z.infer<typeof SignupSchema>) {
  const validated = SignupSchema.parse(data)

  await connectDB()
  const existing = await User.findOne({ email: validated.email })
  if (existing) throw new Error('Email already exists')

  const hashed = await bcrypt.hash(validated.password, 10)
  await User.create({ name: validated.name, email: validated.email, password: hashed })
}

export async function toggleFollow(targetUserId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  if (session.user.id === targetUserId) throw new Error('Cannot follow yourself')

  await connectDB()
  const existing = await Follow.findOne({
    followerId: session.user.id,
    followingId: targetUserId,
  })

  if (existing) {
    await Follow.findByIdAndDelete(existing._id)
  } else {
    await Follow.create({ followerId: session.user.id, followingId: targetUserId })
  }

  revalidatePath(`/ko/profile/${targetUserId}`)
  revalidatePath(`/en/profile/${targetUserId}`)
  return !existing
}

export async function updateProfile(data: { name?: string; image?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await connectDB()
  await User.findByIdAndUpdate(session.user.id, data)

  revalidatePath('/ko/me')
  revalidatePath('/en/me')
}
