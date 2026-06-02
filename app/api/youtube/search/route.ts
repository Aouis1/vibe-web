import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  const continuation = request.nextUrl.searchParams.get('continuation') || undefined

  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  const scraperUrl = process.env.YOUTUBE_SCRAPER_URL || 'http://localhost:8000'

  try {
    const params = new URLSearchParams({ q })
    if (continuation) params.set('continuation', continuation)

    const res = await fetch(`${scraperUrl}/search?${params}`, {
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      throw new Error(`Scraper error: ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('YouTube search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
