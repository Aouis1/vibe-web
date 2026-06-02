export interface YoutubeSearchItem {
  id: string
  title: string
  artist: string
  thumbnailUrl: string
  duration: string
}

export interface YoutubeSearchResult {
  items: YoutubeSearchItem[]
  nextPageToken?: string
}

// YouTube InnerTube API — API 키 불필요 (YouTube 웹사이트가 내부적으로 사용하는 엔드포인트)
const INNERTUBE_URL =
  'https://www.youtube.com/youtubei/v1/search?prettyPrint=false'

const INNERTUBE_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20231121.08.00',
    hl: 'ko',
    gl: 'KR',
  },
}

export async function searchYoutube(
  query: string,
  continuationToken?: string
): Promise<YoutubeSearchResult> {
  const body: Record<string, unknown> = {
    context: INNERTUBE_CONTEXT,
    query,
    params: 'EgIQAQ%3D%3D', // 음악 카테고리 필터
  }
  if (continuationToken) {
    body.continuation = continuationToken
  }

  const res = await fetch(INNERTUBE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'X-YouTube-Client-Name': '1',
      'X-YouTube-Client-Version': '2.20231121.08.00',
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error(`InnerTube error: ${res.status}`)

  const data = await res.json()

  const items: YoutubeSearchItem[] = []
  let nextToken: string | undefined

  // 응답 파싱
  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents ??
    data?.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction
      ?.continuationItems ??
    []

  for (const section of contents) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemSection: any[] | null = section?.itemSectionRenderer?.contents ?? null

    // continuationToken 추출
    const contToken =
      section?.continuationItemRenderer?.continuationEndpoint
        ?.continuationCommand?.token
    if (contToken) nextToken = contToken

    if (!itemSection) continue

    for (const item of itemSection) {
      const vr = item?.videoRenderer
      if (!vr) continue

      const id: string = vr.videoId
      const title: string =
        vr.title?.runs?.[0]?.text ?? vr.title?.simpleText ?? ''
      const artist: string =
        vr.ownerText?.runs?.[0]?.text ?? vr.shortBylineText?.runs?.[0]?.text ?? ''
      const thumbs: { url: string; width: number }[] =
        vr.thumbnail?.thumbnails ?? []
      const thumbnailUrl =
        thumbs.find((t) => t.width >= 320)?.url ??
        thumbs[thumbs.length - 1]?.url ??
        `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
      const duration: string =
        vr.lengthText?.simpleText ?? vr.lengthText?.runs?.[0]?.text ?? ''

      if (id && title) {
        items.push({ id, title, artist, thumbnailUrl: thumbnailUrl.split('?')[0], duration })
      }

      if (items.length >= 10) break
    }

    if (items.length >= 10) break
  }

  return { items, nextPageToken: nextToken }
}
