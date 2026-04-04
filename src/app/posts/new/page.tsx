import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import NewPostForm from './new-post-form'

const build_cookie_list = (cookieHeader: string | null) => {
    return (
        cookieHeader?.split(';').map(cookie => {
            const [name, ...rest] = cookie.trim().split('=')
            return { name, value: rest.join('=') }
        }) ?? []
    )
}

const NewPostPage = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? ''

    if (!url || !key) {
        return (
            <div className='rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
                Supabaseの環境変数が未設定です
            </div>
        )
    }

    const cookieStore = await cookies()
    const headerList = await headers()
    const cookieHeader = headerList.get('cookie')

    const supabase = createServerClient(url, key, {
        cookies: {
            getAll() {
                if (typeof cookieStore.getAll === 'function') {
                    return cookieStore.getAll()
                }

                return build_cookie_list(cookieHeader)
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    cookieStore.set(name, value, options)
                })
            },
        },
    })

    const { data } = await supabase.auth.getUser()
    if (!data.user) {
        redirect('/auth/login')
    }

    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-2xl font-bold text-gray-800'>新規投稿</h1>
                <p className='mt-2 text-sm text-gray-600'>タイトルと本文を入力してください。</p>
            </div>
            <NewPostForm />
        </div>
    )
}

export default NewPostPage
