'use client'

import { useCallback, useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

export default function GoogleLoginButton() {
    const supabase = useMemo(() => createSupabaseBrowserClient(), [])

    const handleLogin = useCallback(async () => {
        if (
            !process.env.NEXT_PUBLIC_SUPABASE_URL ||
            !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
        ) {
            alert('Supabaseの環境変数が未設定です')
            return
        }

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }, [supabase])

    return (
        <button
            onClick={handleLogin}
            className='rounded-md border border-gray-200 bg-white px-6 py-2 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50'
        >
            Googleでログイン
        </button>
    )
}
