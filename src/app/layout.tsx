import type { Metadata, Viewport } from 'next'
import { Anton, Bebas_Neue, DM_Sans } from 'next/font/google'
import './globals.css'

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dmsans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Na Grade — Seu diário de shows',
  description:
    'Registre shows, avalie, acompanhe seus gastos e descubra seus padrões. Como o Letterboxd, mas pra quem vive de ingresso na mão.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Na Grade',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F0E13',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${anton.variable} ${bebasNeue.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen bg-bg text-papel font-body antialiased">
        {children}
      </body>
    </html>
  )
}
