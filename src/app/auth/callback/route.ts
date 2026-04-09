import crypto from 'node:crypto'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const build_account_id = () => {
    return `u_${crypto.randomBytes(4).toString('hex')}`
}

const get_avatar_extension = (contentType: string | null, url: string) => {
    if (contentType?.includes('png')) return 'png'
    if (contentType?.includes('jpeg')) return 'jpg'
    if (contentType?.includes('jpg')) return 'jpg'
    if (contentType?.includes('webp')) return 'webp'
    if (contentType?.includes('gif')) return 'gif'
    const match = url.split('?')[0].match(/\.(png|jpe?g|webp|gif)$/i)
    return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'png'
}

const get_safe_next_path = (value: string | null) => {
    if (!value) return '/'
    if (!value.startsWith('/')) return '/'
    if (value.startsWith('//')) return '/'
    return value
}

const upload_avatar = async (
    admin: ReturnType<typeof createAdminClient>,
    userId: string,
    url: string,
) => {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            return null
        }
        const contentType = response.headers.get('content-type')
        const extension = get_avatar_extension(contentType, url)
        const buffer = Buffer.from(await response.arrayBuffer())
        const filePath = `${userId}/${crypto.randomBytes(8).toString('hex')}.${extension}`
        const { error } = await admin.storage
            .from('avatars')
            .upload(filePath, buffer, { contentType: contentType ?? 'image/png', upsert: true })

        if (error) {
            return null
        }

        const { data } = admin.storage.from('avatars').getPublicUrl(filePath)
        return data.publicUrl
    } catch {
        return null
    }
}

export async function GET(request: Request) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const next_path = get_safe_next_path(url.searchParams.get('next'))

    if (code) {
        const response = NextResponse.redirect(new URL(next_path, url.origin))

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

                const raw_avatar_url = userData.user.user_metadata?.avatar_url ?? null
                const stored_avatar_url = raw_avatar_url
                    ? await upload_avatar(admin, userData.user.id, raw_avatar_url)
                    : null

                await admin.from('profiles').insert({
                    id: userData.user.id,
                    display_name:
                        userData.user.user_metadata?.name ??
                        userData.user.user_metadata?.full_name ??
                        userData.user.email?.split('@')[0] ??
                        'user',
                    account_id,
                    avatar_url: stored_avatar_url,
                    role: 'member',
                })
            }
        }

        return response
    }

    return NextResponse.redirect(new URL('/auth/login', url.origin))
}
