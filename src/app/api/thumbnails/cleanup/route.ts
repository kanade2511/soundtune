import { NextResponse } from 'next/server'
import { cleanup_thumbnail_on_create } from '@/lib/actions/thumbnails'
import { isValidArticleId } from '@/lib/article-id'
import { createClient } from '@/lib/supabase/server'

const parse_paths = (value: unknown) => {
    if (!Array.isArray(value)) return []
    return value.filter((item): item is string => typeof item === 'string')
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ ok: false }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const article_id = String(body?.articleId ?? '')

    if (!isValidArticleId(article_id)) {
        return NextResponse.json({ ok: false }, { status: 400 })
    }

    const paths = parse_paths(body?.paths)
    await cleanup_thumbnail_on_create(article_id, paths)

    return NextResponse.json({ ok: true })
}
