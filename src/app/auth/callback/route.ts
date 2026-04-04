import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

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
        return response
    }

    return NextResponse.redirect(new URL('/auth/login', url.origin))
}
