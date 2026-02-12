import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from '@/components/Layout/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Arpit Consultancy | Career Transformation & Mentorship',
  description: 'Empowering students with industry-aligned training, guaranteed placements, and direct mentorship from experts at IBM and beyond.',
  keywords: 'career transformation, mentorship, job placement, software engineering, arpit consultancy, arpit srivastava',
  icons: {
    icon: '/favicon.svg'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
