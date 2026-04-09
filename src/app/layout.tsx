import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

import Footer from '@/components/Footer'
import Header from '@/components/Header'

const geist_sans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geist_mono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'SoundTune',
    // description: '',
    icons: {
        icon: '/logo/favicon.png',
        apple: '/logo/apple-touch-icon.png',
    },
    appleWebApp: {
        title: 'SoundTune',
    },
}

const RootLayout = ({
    children,
}: Readonly<{
    children: React.ReactNode
}>) => {
    return (
        <html lang='ja'>
            <body className={`${geist_sans.variable} ${geist_mono.variable} antialiased`}>
                <div className='background flex min-h-screen flex-col bg-gradient-to-br from-blue-100 via-white to-indigo-100'>
                    <Header />
                    <main className='flex-1'>
                        <div className='container mx-auto px-6 py-8 sm:px-8 lg:px-12'>
                            {children}
                        </div>
                    </main>
                    <Footer />
                </div>
            </body>
        </html>
    )
}

export default RootLayout
