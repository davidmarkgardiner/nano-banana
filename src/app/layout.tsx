import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { CanvasImageProvider } from '@/context/CanvasImageContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nano Banana - AI Image Generator',
  description: 'Generate beautiful images from text using AI - powered by Firebase and Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        <AuthProvider>
          <CanvasImageProvider>
            {children}
          </CanvasImageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}