import crypto from 'node:crypto'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const build_account_id = () => {
    return `u_${crypto.randomBytes(4).toString('hex')}`
}

export async function GET(request: Request) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    if (code) {
        const response = NextResponse.redirect(new URL('/', url.origin))

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? '',
            {
                cookies: {
                    getAll() {
                        return (
                            request.headers
                                .get('cookie')
                                ?.split(';')
                                .map(cookie => {
                                    const [name, ...rest] = cookie.trim().split('=')
                                    return { name, value: rest.join('=') }
                                }) ?? []
                        )
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            },
        )

        await supabase.auth.exchangeCodeForSession(code)

        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
            const admin = createAdminClient()
            const { data: existing } = await admin
                .from('profiles')
                .select('id')
                .eq('id', userData.user.id)
                .single()

            if (!existing) {
                let account_id = build_account_id()

                for (let i = 0; i < 5; i += 1) {
                    const { data: conflict } = await admin
                        .from('profiles')
                        .select('id')
                        .eq('account_id', account_id)
                        .single()

                    if (!conflict) {
                        break
                    }

                    account_id = build_account_id()
                }

                await admin.from('profiles').insert({
                    id: userData.user.id,
                    display_name:
                        userData.user.user_metadata?.name ??
                        userData.user.user_metadata?.full_name ??
                        userData.user.email?.split('@')[0] ??
                        'user',
                    account_id,
                    avatar_url: userData.user.user_metadata?.avatar_url ?? null,
                    role: 'member',
                })
            }
        }

        return response
    }

    return NextResponse.redirect(new URL('/auth/login', url.origin))
}
