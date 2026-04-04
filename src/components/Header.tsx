'use client'

import HamburgerMenu from '@/components/HamburgerMenu'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const Header = () => {
    const [is_menu_open, set_is_menu_open] = useState(false)

    const toggle_menu = () => {
        set_is_menu_open(!is_menu_open)
    }

    return (
        <header className='sticky top-0 z-50 border-b border-blue-200 bg-white/80 backdrop-blur-sm h-20'>
            <div className='container mx-auto px-4 h-full'>
                <div className='flex items-center justify-between h-full'>
                    <div className='flex items-center space-x-2'>
                        <Link href='/' className='flex items-center'>
                            {/* Desktop Logo */}
                            <Image
                                src='/logo/logo_normal.png'
                                alt='SoundTune'
                                height={1024}
                                width={1024}
                                className='hidden md:block h-12 w-auto'
                                priority
                            />
                            {/* Mobile Logo */}
                            <Image
                                src='/logo/logo_small.png'
                                alt='SoundTune'
                                height={256}
                                width={256}
                                className='block md:hidden h-10 w-auto'
                                priority
                            />
                        </Link>
                    </div>

                    <div className='flex items-center space-x-4'>
                        {/* モバイルでのみハンバーガーメニューを表示 */}
                        <div className='md:hidden relative'>
                            <HamburgerMenu isOpen={is_menu_open} onToggle={toggle_menu} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
