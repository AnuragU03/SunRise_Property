import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { IframeLoggerInit } from '@/components/IframeLoggerInit'
import ClientProviders from '@/components/ClientProviders'
import { validateEnv } from '@/lib/envCheck'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GharSoch Broker Assistant',
  description: 'AI-assisted broker operations for leads, calls, campaigns, and appointments.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await validateEnv({ checkAdminBootstrap: true })
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <IframeLoggerInit />
        <ClientProviders>
          {children}
        </ClientProviders>
        <Toaster position="top-right" theme="light" richColors />
      </body>
    </html>
  )
}
