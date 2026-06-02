import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Vibe',
    default: 'Vibe — Music Playlist SNS',
  },
  description: 'Share your music taste with the world. Create, discover, and enjoy playlists.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
