import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

const sanitize_next_path = (next_path: string) => {
    if (!next_path.startsWith('/')) return '/'
    if (next_path.startsWith('//')) return '/'
    return next_path
}

export const signInWithGoogle = async (next_path = '/') => {
    if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    ) {
        alert('Supabaseの環境変数が未設定です')
        return
    }

    const supabase = createSupabaseBrowserClient()
    const safe_next_path = sanitize_next_path(next_path)
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safe_next_path)}`,
        },
    })

    if (error) {
        alert('Googleログインに失敗しました')
    }
}
