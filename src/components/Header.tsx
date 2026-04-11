'use client'

import { NotebookPen, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import AccountIconMenu from '@/components/header/AccountIconMenu'
import useHeaderAuthState from '@/components/header/useHeaderAuthState'

const Header = () => {
    const [is_client_ready, set_is_client_ready] = useState(false)
    const { is_loading_auth, is_logged_in, avatar_url, display_name, account_id, is_admin } =
        useHeaderAuthState()

    useEffect(() => {
        set_is_client_ready(true)
    }, [])

    return (
        <header className='sticky top-0 z-50 h-[72px] border-b border-blue-200 bg-white/80 backdrop-blur-sm'>
            <div className='container mx-auto px-6 sm:px-8 lg:px-12 h-full'>
                <div className='flex items-center justify-between h-full'>
                    <div className='flex items-center space-x-2'>
                        <Link href='/' className='flex items-center'>
                            {/* Always use normal logo on both mobile and desktop */}
                            <Image
                                src='/logo/logo_normal.png'
                                alt='SoundTune'
                                height={1024}
                                width={1024}
                                className='h-8 w-auto sm:h-10'
                                priority
                            />
                        </Link>
                    </div>
                    <div className='flex items-center gap-6'>
                        {(!is_client_ready || is_loading_auth) && (
                            <div className='flex h-8 w-8 animate-pulse items-center justify-center rounded-full border border-black/20 bg-gray-100 sm:h-9 sm:w-9'>
                                <User className='h-4 w-4 text-gray-500 sm:h-5 sm:w-5' />
                            </div>
                        )}

                        {is_client_ready && is_logged_in && (
                            <AccountIconMenu
                                avatar_url={avatar_url}
                                display_name={display_name}
                                account_id={account_id}
                                is_admin={is_admin}
                            />
                        )}

                        <Link
                            href='/posts/new'
                            className='inline-flex items-center gap-1.5 rounded-md border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-white sm:px-3.5 sm:py-2 sm:text-sm'
                        >
                            <NotebookPen className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
                            <span>投稿する</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
