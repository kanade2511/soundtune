'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { signInWithGoogle } from '@/lib/auth/google-login'

export default function LoginPage() {
    const search_params = useSearchParams()

    useEffect(() => {
        const next_path = search_params.get('next') ?? '/'
        void signInWithGoogle(next_path)
    }, [search_params])

    return (
        <div className='flex min-h-[60vh] flex-col items-center justify-center gap-6'>
            <h1 className='text-2xl font-bold text-gray-800'>Googleログインへ移動中...</h1>
        </div>
    )
}
