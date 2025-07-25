'use client'

import HamburgerMenu from '@/components/HamburgerMenu'
import { SearchBox } from '@/components/SearchBox'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    return (
        <header className='sticky top-0 z-50 border-b border-blue-200 bg-white/80 backdrop-blur-sm h-20'>
            <div className='container mx-auto px-4 h-full'>
                <div className='flex items-center justify-between h-full'>
                    <div className='flex items-center space-x-2'>
                        <Link href='/' className='flex items-center'>
                            {/* Desktop Logo */}
                            <Image
                                src='/images/logo/logo_normal.png'
                                alt='SoundTune'
                                height={1024}
                                width={1024}
                                className='hidden md:block h-12 w-auto'
                                priority
                            />
                            {/* Mobile Logo */}
                            <Image
                                src='/images/logo/logo_small.png'
                                alt='SoundTune'
                                height={256}
                                width={256}
                                className='block md:hidden h-10 w-auto'
                                priority
                            />
                        </Link>
                    </div>

                    <div className='flex items-center space-x-4'>
                        {/* デスクトップでは検索ボックス、モバイルでは非表示 */}
                        <div className='hidden md:block'>
                            <SearchBox />
                        </div>
                        {/* モバイルでのみハンバーガーメニューを表示 */}
                        <div className='md:hidden relative'>
                            <HamburgerMenu isOpen={isMenuOpen} onToggle={toggleMenu} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
