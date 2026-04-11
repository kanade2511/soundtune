import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'

const build_cookie_list = (cookieHeader: string | null) => {
    return (
        cookieHeader?.split(';').map(cookie => {
            const [name, ...rest] = cookie.trim().split('=')
            return { name, value: rest.join('=') }
        }) ?? []
    )
}

export const createClient = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? ''

    if (!url || !key) {
        throw new Error('Supabaseの環境変数が未設定です')
    }

    const cookieStore = await cookies()
    const headerList = await headers()
    const cookieHeader = headerList.get('cookie')

    return createServerClient(url, key, {
        cookies: {
            getAll() {
                if (typeof cookieStore.getAll === 'function') {
                    return cookieStore.getAll()
                }

                return build_cookie_list(cookieHeader)
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                } catch {
                    // Server Components cannot mutate cookies. Ignore and rely on
                    // middleware/route handlers/server actions where mutation is allowed.
                }
            },
        },
    })
}

export const createAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const serviceKey = process.env.SUPABASE_SECRET_KEY ?? ''

    if (!url || !serviceKey) {
        throw new Error('Supabaseの環境変数が未設定です')
    }

    return createSupabaseClient(url, serviceKey, {
        auth: {
            persistSession: false,
        },
    })
}
