'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">오류가 발생했어요</h2>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
