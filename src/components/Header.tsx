'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import HamburgerMenu from '@/components/HamburgerMenu'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

const Header = () => {
    const [is_menu_open, set_is_menu_open] = useState(false)
    const [is_logged_in, set_is_logged_in] = useState(false)
    const [avatar_url, set_avatar_url] = useState<string | null>(null)
    const [account_id, set_account_id] = useState<string | null>(null)
    const [is_admin, set_is_admin] = useState(false)
    const [menu_open, set_menu_open] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = useMemo(() => createSupabaseBrowserClient(), [])

    const toggle_menu = () => {
        set_is_menu_open(!is_menu_open)
    }

    const handle_logout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    // アバターメニュー外クリックで閉じる
    useEffect(() => {
        if (!menu_open) return
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                set_menu_open(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [menu_open])

    useEffect(() => {
        let is_mounted = true

        const load_session = async () => {
            const { data } = await supabase.auth.getSession()
            if (is_mounted && data.session) {
                set_is_logged_in(true)
                // プロフィール取得
                const { data: userData } = await supabase.auth.getUser()
                if (userData.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('avatar_url, account_id, role')
                        .eq('id', userData.user.id)
                        .single()
                    set_avatar_url(profile?.avatar_url ?? null)
                    set_account_id(profile?.account_id ?? null)
                    set_is_admin(profile?.role === 'admin')
                }
            } else {
                set_is_logged_in(false)
                set_avatar_url(null)
                set_account_id(null)
                set_is_admin(false)
            }
        }

        load_session()

        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            if (is_mounted && session) {
                set_is_logged_in(true)
                // プロフィール再取得
                supabase.auth.getUser().then(({ data: userData }) => {
                    if (userData.user) {
                        supabase
                            .from('profiles')
                            .select('avatar_url, account_id, role')
                            .eq('id', userData.user.id)
                            .single()
                            .then(({ data: profile }) => {
                                set_avatar_url(profile?.avatar_url ?? null)
                                set_account_id(profile?.account_id ?? null)
                                set_is_admin(profile?.role === 'admin')
                            })
                    }
                })
            } else {
                set_is_logged_in(false)
                set_avatar_url(null)
                set_account_id(null)
                set_is_admin(false)
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
                            {/* Always use normal logo on both mobile and desktop */}
                            <Image
                                src='/logo/logo_normal.png'
                                alt='SoundTune'
                                height={1024}
                                width={1024}
                                className='h-10 w-auto sm:h-12'
                                priority
                            />
                        </Link>
                    </div>

                    <div className='flex items-center gap-2 sm:gap-3'>
                        {is_logged_in ? (
                            <>
                                {/* アバターアイコンとメニュー */}
                                <div className='relative' ref={menuRef}>
                                    <button
                                        type='button'
                                        className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none sm:h-10 sm:w-10'
                                        onClick={() => set_menu_open(v => !v)}
                                        title='メニュー'
                                    >
                                        {avatar_url ? (
                                            <Image
                                                src={avatar_url}
                                                alt='avatar'
                                                width={40}
                                                height={40}
                                                className='h-7 w-7 rounded-full object-cover sm:h-8 sm:w-8'
                                            />
                                        ) : (
                                            <div className='flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-base font-bold text-gray-500 sm:h-10 sm:w-10 sm:text-lg'>
                                                {account_id
                                                    ? account_id.charAt(0).toUpperCase()
                                                    : 'U'}
                                            </div>
                                        )}
                                    </button>
                                    {menu_open && (
                                        <div className='absolute right-0 z-50 mt-2 w-44 rounded-lg border border-gray-200 bg-white py-2 shadow-lg sm:w-48'>
                                            <Link
                                                href='/profile'
                                                className='block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm'
                                                onClick={() => set_menu_open(false)}
                                            >
                                                プロフィール編集
                                            </Link>
                                            {is_admin && (
                                                <Link
                                                    href='/admin/console'
                                                    className='block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm'
                                                    onClick={() => set_menu_open(false)}
                                                >
                                                    Admin Console
                                                </Link>
                                            )}
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    set_menu_open(false)
                                                    handle_logout()
                                                }}
                                                className='block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm'
                                            >
                                                ログアウト
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Link
                                href='/auth/login'
                                className='hidden md:inline-flex rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50'
                            >
                                ログイン
                            </Link>
                        )}
                        <div className={is_logged_in ? 'ml-3 sm:ml-4' : ''}>
                            <HamburgerMenu isOpen={is_menu_open} onToggle={toggle_menu} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
