import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { isValidArticleId } from '@/lib/article-id'
import { createAdminClient, createClient } from '@/lib/supabase/server'

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

export async function POST(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const form_data = await request.formData()
    const article_id = String(form_data.get('articleId') ?? '')
    const file_value = form_data.get('file')

    if (!isValidArticleId(article_id)) {
        return NextResponse.json({ error: '記事IDが不正です' }, { status: 400 })
    }

    if (!(file_value instanceof File)) {
        return NextResponse.json({ error: '画像ファイルが不正です' }, { status: 400 })
    }

    const extension = get_extension(file_value)
    const file_id = crypto.randomUUID()
    const file_path = `${article_id}/${file_id}.${extension}`

    const admin = createAdminClient()
    const { error } = await admin.storage
        .from('thumbnails')
        .upload(file_path, file_value, { upsert: true, contentType: file_value.type })

    if (error) {
        return NextResponse.json(
            { error: error.message ?? '画像アップロードに失敗しました' },
            { status: 500 },
        )
    }

    const { data } = admin.storage.from('thumbnails').getPublicUrl(file_path)
    return NextResponse.json({ publicUrl: data.publicUrl, path: file_path })
}
