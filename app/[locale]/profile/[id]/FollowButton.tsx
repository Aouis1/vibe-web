'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { toggleFollow } from '@/app/actions/user'

interface FollowButtonProps {
  targetUserId: string
  isFollowing: boolean
}

export default function FollowButton({ targetUserId, isFollowing: initial }: FollowButtonProps) {
  const t = useTranslations('profile')
  const [isFollowing, setIsFollowing] = useState(initial)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleFollow(targetUserId)
      setIsFollowing(result)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-6 py-2 rounded-full text-sm font-medium transition disabled:opacity-50 ${
        isFollowing
          ? 'bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-400'
          : 'bg-violet-600 hover:bg-violet-700 text-white'
      }`}
    >
      {isPending ? '...' : isFollowing ? t('unfollow') : t('follow')}
    </button>
  )
}
