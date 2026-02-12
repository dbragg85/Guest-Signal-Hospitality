import '../styles/globals.css'

export const metadata = {
  title: 'Guest Signal Hospitality - Hospitality Intelligence & Guest Experience Analytics',
  description: 'We help restaurants identify operational strengths, guest experience gaps, and revenue opportunities through advanced review intelligence and competitive analysis.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

