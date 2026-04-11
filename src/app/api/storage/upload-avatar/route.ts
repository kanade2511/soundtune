import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const AVATAR_PUBLIC_PREFIX = '/storage/v1/object/public/avatars/'

const get_extension = (file: File) => {
    const by_name = file.name.split('.').pop()?.toLowerCase()
    if (by_name) return by_name

    if (file.type.includes('png')) return 'png'
    if (file.type.includes('jpeg')) return 'jpg'
    if (file.type.includes('jpg')) return 'jpg'
    if (file.type.includes('webp')) return 'webp'
    if (file.type.includes('gif')) return 'gif'
    return 'bin'
}

const extract_old_avatar_path = (thumbnail_url: string | null) => {
    if (!thumbnail_url) return null

    try {
        const url = new URL(thumbnail_url)
        const [, path = ''] = url.pathname.split(AVATAR_PUBLIC_PREFIX)
        if (!path) return null
        return decodeURIComponent(path)
    } catch {
        return null
    }
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const form_data = await request.formData()
    const file_value = form_data.get('file')
    const old_avatar_url = String(form_data.get('oldAvatarUrl') ?? '').trim() || null

    if (!(file_value instanceof File)) {
        return NextResponse.json({ error: '画像ファイルが不正です' }, { status: 400 })
    }

    const extension = get_extension(file_value)
    const file_id = crypto.randomUUID()
    const file_path = `${user.id}/${file_id}.${extension}`

    const admin = createAdminClient()
    const { error } = await admin.storage
        .from('avatars')
        .upload(file_path, file_value, { upsert: true, contentType: file_value.type })

    if (error) {
        return NextResponse.json(
            { error: error.message ?? '画像アップロードに失敗しました' },
            { status: 500 },
        )
    }

    const old_path = extract_old_avatar_path(old_avatar_url)
    if (old_path?.startsWith(`${user.id}/`) && old_path !== file_path) {
        void admin.storage.from('avatars').remove([old_path])
    }

    const { data } = admin.storage.from('avatars').getPublicUrl(file_path)
    return NextResponse.json({ publicUrl: data.publicUrl, path: file_path })
}
