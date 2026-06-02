'use client'

import TrackList from './TrackList'

interface Track {
  id: string
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
  duration?: string | null
  order: number
}

interface EditableTrackListProps {
  tracks: Track[]
}

export default function EditableTrackList({ tracks }: EditableTrackListProps) {
  return (
    <TrackList
      tracks={tracks}
      currentIndex={-1}
      onSelect={() => {}}
      isOwner={true}
      editable={true}
    />
  )
}
