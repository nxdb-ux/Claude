import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CMC Content Generator',
  description: 'Internal tool for CoinMarketCap community content generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
