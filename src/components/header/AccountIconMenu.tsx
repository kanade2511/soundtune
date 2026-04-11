'use client'

import { LogOut, NotebookPen, UserPen, Wrench } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { generatePostId } from '@/lib/post-id'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

type AccountIconMenuProps = {
    avatar_url: string | null
    display_name: string | null
    account_id: string | null
    is_admin: boolean
}

const AccountIconMenu = ({
    avatar_url,
    display_name,
    account_id,
    is_admin,
}: AccountIconMenuProps) => {
    const [is_account_menu_open, set_is_account_menu_open] = useState(false)
    const [is_logging_out, set_is_logging_out] = useState(false)
    const account_menu_ref = useRef<HTMLDivElement | null>(null)
    const router = useRouter()
    const supabase = useMemo(() => createSupabaseBrowserClient(), [])

    const handle_create_post_click = () => {
        set_is_account_menu_open(false)

        if (!account_id) {
            router.push('/auth/login')
            return
        }

        router.push(`/${account_id}/${generatePostId(14)}/edit`)
    }

    useEffect(() => {
        if (!is_account_menu_open) return

        const handle_pointer_down = (event: PointerEvent) => {
            if (!account_menu_ref.current?.contains(event.target as Node)) {
                set_is_account_menu_open(false)
            }
        }

        const handle_escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                set_is_account_menu_open(false)
            }
        }

        document.addEventListener('pointerdown', handle_pointer_down)
        document.addEventListener('keydown', handle_escape)

        return () => {
            document.removeEventListener('pointerdown', handle_pointer_down)
            document.removeEventListener('keydown', handle_escape)
        }
    }, [is_account_menu_open])

    const handle_logout = async () => {
        if (is_logging_out) return
        set_is_logging_out(true)

        await supabase.auth.signOut()
        set_is_account_menu_open(false)
        set_is_logging_out(false)
        router.push('/auth/login')
        router.refresh()
    }

    return (
        <div ref={account_menu_ref} className='relative flex items-center'>
            <button
                type='button'
                onClick={() => set_is_account_menu_open(prev => !prev)}
                className='flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-black/20 bg-white/70 sm:h-9 sm:w-9'
                title='アカウントメニュー'
                aria-haspopup='menu'
                aria-expanded={is_account_menu_open}
                aria-controls='account-menu'
            >
                {avatar_url ? (
                    <Image
                        src={avatar_url}
                        alt='avatar'
                        width={40}
                        height={40}
                        className='h-full w-full object-cover'
                    />
                ) : (
                    <span className='text-xs font-bold text-gray-600'>
                        {account_id ? account_id.charAt(0).toUpperCase() : 'U'}
                    </span>
                )}
            </button>

            <div
                id='account-menu'
                role='menu'
                className={`absolute right-0 top-[calc(100%+0.5rem)] min-w-[220px] rounded-lg border border-black/10 bg-white/95 p-2 shadow-md transition-all duration-150 ${
                    is_account_menu_open
                        ? 'visible translate-y-0 opacity-100'
                        : 'invisible pointer-events-none -translate-y-1 opacity-0'
                }`}
            >
                {account_id ? (
                    <Link
                        href={`/${account_id}`}
                        role='menuitem'
                        className='block rounded-md px-4 py-2.5 transition hover:bg-black/[0.04]'
                        onClick={() => set_is_account_menu_open(false)}
                    >
                        <p className='text-sm font-semibold text-black'>
                            {display_name ?? account_id ?? 'user'}
                        </p>
                        <p className='text-xs text-gray-500'>@{account_id}</p>
                    </Link>
                ) : (
                    <div className='px-4 py-2.5'>
                        <p className='text-sm font-semibold text-black'>
                            {display_name ?? account_id ?? 'user'}
                        </p>
                        <p className='text-xs text-gray-500'>@unknown</p>
                    </div>
                )}
                <div className='my-1 border-t border-black/10' />
                <button
                    type='button'
                    role='menuitem'
                    className='flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-black/[0.04]'
                    onClick={handle_create_post_click}
                >
                    <NotebookPen className='h-4 w-4 shrink-0' aria-hidden='true' />
                    <span>投稿する</span>
                </button>
                <Link
                    href='/profile'
                    role='menuitem'
                    className='flex items-center gap-2 rounded-md px-4 py-2.5 text-sm text-gray-700 transition hover:bg-black/[0.04]'
                    onClick={() => set_is_account_menu_open(false)}
                >
                    <UserPen className='h-4 w-4 shrink-0' aria-hidden='true' />
                    <span>プロフィール編集</span>
                </Link>
                {is_admin ? (
                    <Link
                        href='/admin/console'
                        role='menuitem'
                        className='flex items-center gap-2 rounded-md px-4 py-2.5 text-sm text-gray-700 transition hover:bg-black/[0.04]'
                        onClick={() => set_is_account_menu_open(false)}
                    >
                        <Wrench className='h-4 w-4 shrink-0' aria-hidden='true' />
                        <span>管理者コンソール</span>
                    </Link>
                ) : null}
                <div className='my-1 border-t border-black/10' />
                <button
                    type='button'
                    role='menuitem'
                    onClick={handle_logout}
                    disabled={is_logging_out}
                    className='flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-60'
                >
                    <LogOut className='h-4 w-4 shrink-0' aria-hidden='true' />
                    <span>{is_logging_out ? 'ログアウト中...' : 'ログアウト'}</span>
                </button>
            </div>
        </div>
    )
}

export default AccountIconMenu
