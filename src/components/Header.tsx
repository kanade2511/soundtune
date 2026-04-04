'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import HamburgerMenu from '@/components/HamburgerMenu'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

const Header = () => {
    const [is_menu_open, set_is_menu_open] = useState(false)
    const [is_logged_in, set_is_logged_in] = useState(false)
    const router = useRouter()
    const supabase = useMemo(() => createSupabaseBrowserClient(), [])

    const toggle_menu = () => {
        set_is_menu_open(!is_menu_open)
    }

    const handle_logout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    useEffect(() => {
        let is_mounted = true

        const load_session = async () => {
            const { data } = await supabase.auth.getSession()
            if (is_mounted) {
                set_is_logged_in(!!data.session)
            }
        }

        load_session()

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            if (is_mounted) {
                set_is_logged_in(!!session)
            }
        })

        return () => {
            is_mounted = false
            subscription.subscription.unsubscribe()
        }
    }, [supabase])

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
                        {is_logged_in ? (
                            <button
                                type='button'
                                onClick={handle_logout}
                                className='hidden md:inline-flex rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50'
                            >
                                ログアウト
                            </button>
                        ) : (
                            <Link
                                href='/auth/login'
                                className='hidden md:inline-flex rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50'
                            >
                                ログイン
                            </Link>
                        )}
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
