import { NextResponse } from 'next/server'
import { isValidArticleId } from '@/lib/article-id'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const ARTICLE_MEDIA_BUCKET = 'Articles'
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

const get_next_thumbnail_version = (post_id: string, current_path: string | null) => {
    if (!current_path) {
        return 1
    }

    if (!current_path.startsWith(`${post_id}/`)) {
        return 1
    }

    const file_name = current_path.slice(post_id.length + 1)
    const match = file_name.match(/^thumbnail-v(\d+)\.[A-Za-z0-9]+$/)
    if (!match) {
        return 1
    }

    const current_version = Number.parseInt(match[1], 10)
    if (!Number.isFinite(current_version) || current_version < 1) {
        return 1
    }

    return current_version + 1
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
    const post_id = String(form_data.get('postId') ?? '')
    const current_path_raw = String(form_data.get('currentPath') ?? '').trim()
    const current_path = current_path_raw || null
    const file_value = form_data.get('file')

    if (!isValidArticleId(post_id)) {
        return NextResponse.json({ error: '投稿IDが不正です' }, { status: 400 })
    }

    if (!(file_value instanceof File)) {
        return NextResponse.json({ error: '画像ファイルが不正です' }, { status: 400 })
    }

    const extension = get_extension(file_value)
    const next_version = get_next_thumbnail_version(post_id, current_path)
    const file_path = `${post_id}/thumbnail-v${next_version}.${extension}`

    const admin = createAdminClient()
    const { error } = await admin.storage
        .from(ARTICLE_MEDIA_BUCKET)
        .upload(file_path, file_value, { upsert: true, contentType: file_value.type })

    if (error) {
        return NextResponse.json(
            { error: error.message ?? '画像アップロードに失敗しました' },
            { status: 500 },
        )
    }

    const { data } = admin.storage.from(ARTICLE_MEDIA_BUCKET).getPublicUrl(file_path)
    return NextResponse.json({ publicUrl: data.publicUrl, path: file_path })
}
