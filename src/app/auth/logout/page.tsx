'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

const LogoutPage = () => {
    const router = useRouter()
    const supabase = useMemo(() => createSupabaseBrowserClient(), [])

    useEffect(() => {
        const sign_out = async () => {
            await supabase.auth.signOut()
            router.replace('/auth/login')
        }

        sign_out()
    }, [router, supabase])

    return (
        <div className='flex min-h-[60vh] items-center justify-center'>
            <p className='text-sm text-gray-600'>ログアウト中...</p>
        </div>
    )
}

export default LogoutPage
