import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const USER_MEDIA_BUCKET = 'Users'
const AVATAR_PUBLIC_PREFIX = '/storage/v1/object/public/Users/'
const KNOWN_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])

const get_extension = (file: File) => {
    const by_name = file.name.split('.').pop()?.toLowerCase()
    if (by_name && KNOWN_IMAGE_EXTENSIONS.has(by_name)) {
        return by_name === 'jpeg' ? 'jpg' : by_name
    }

    if (file.type.includes('png')) return 'png'
    if (file.type.includes('jpeg')) return 'jpg'
    if (file.type.includes('jpg')) return 'jpg'
    if (file.type.includes('webp')) return 'webp'
    if (file.type.includes('gif')) return 'gif'
    return 'bin'
}

const get_next_avatar_version = (user_id: string, current_path: string | null) => {
    if (!current_path) {
        return 1
    }

    if (!current_path.startsWith(`${user_id}/`)) {
        return 1
    }

    const file_name = current_path.slice(user_id.length + 1)
    const match = file_name.match(/^avatar-v(\d+)\.[A-Za-z0-9]+$/)
    if (!match) {
        return 1
    }

    const current_version = Number.parseInt(match[1], 10)
    if (!Number.isFinite(current_version) || current_version < 1) {
        return 1
    }

    return current_version + 1
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
    const current_path_raw = String(form_data.get('currentPath') ?? '').trim()
    const current_path = current_path_raw || null
    const old_avatar_url = String(form_data.get('oldAvatarUrl') ?? '').trim() || null

    if (!(file_value instanceof File)) {
        return NextResponse.json({ error: '画像ファイルが不正です' }, { status: 400 })
    }

    const extension = get_extension(file_value)
    const next_version = get_next_avatar_version(user.id, current_path)
    const file_path = `${user.id}/avatar-v${next_version}.${extension}`

    const admin = createAdminClient()
    const { error } = await admin.storage
        .from(USER_MEDIA_BUCKET)
        .upload(file_path, file_value, { upsert: true, contentType: file_value.type })

    if (error) {
        return NextResponse.json(
            { error: error.message ?? '画像アップロードに失敗しました' },
            { status: 500 },
        )
    }

    const old_path = current_path ?? extract_old_avatar_path(old_avatar_url)
    if (old_path?.startsWith(`${user.id}/`) && old_path !== file_path) {
        void admin.storage.from(USER_MEDIA_BUCKET).remove([old_path])
    }

    const { data } = admin.storage.from(USER_MEDIA_BUCKET).getPublicUrl(file_path)
    return NextResponse.json({ publicUrl: data.publicUrl, path: file_path })
}
