import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

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
                <div className='background bg-gradient-to-br from-blue-100 via-white to-indigo-100'>
                    <Header />
                    <div className='container mx-auto px-4 py-8'>
                        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                            <div className='lg:col-span-2'>{children}</div>
                            <Sidebar />
                        </div>
                    </div>
                    <Footer />
                </div>
            </body>
        </html>
    )
}

export default RootLayout
