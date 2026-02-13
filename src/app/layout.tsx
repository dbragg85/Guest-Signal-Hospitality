import type { Metadata } from 'next'
import './globals.css'
import { Shell } from '@/components/Shell'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Guest Signal Hospitality | Operational intelligence for restaurant owners.',
  description: 'We turn Google Reviews into clear, actionable insights—SWOT, reputation signals, competitive positioning, and a prioritized action plan that improves guest experience and profitability.',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Shell>
          {children}
        </Shell>
      </body>
    </html>
  )
}
