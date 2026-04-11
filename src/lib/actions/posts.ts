'use server'

import crypto from 'node:crypto'
import { redirect } from 'next/navigation'
import {
    getAuthenticatedUserId,
    getCurrentUserAccountId,
    isActionError,
} from '@/lib/actions/action-context'
import {
    cleanup_thumbnail_on_create,
    cleanup_thumbnail_on_delete,
    cleanup_thumbnail_on_update,
} from '@/lib/actions/thumbnails'
import { isValidArticleId } from '@/lib/article-id'
import { set_read_time } from '@/lib/read-time'
import { createAdminClient } from '@/lib/supabase/server'

type ActionState = {
    error?: string
}

const generate_id = (length: number) => {
    return crypto.randomBytes(length).toString('base64url').slice(0, length)
}

const parse_cleanup_paths = (raw_value: FormDataEntryValue | null) => {
    if (typeof raw_value !== 'string' || !raw_value) return []

    try {
        const parsed: unknown = JSON.parse(raw_value)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((value): value is string => typeof value === 'string')
    } catch {
        return []
    }
}

export async function createPost(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const post_id_raw = String(formData.get('postId') ?? '').trim()
    const title = String(formData.get('title') ?? '').trim()
    const content = String(formData.get('content') ?? '').trim()
    const thumbnail_url_raw = String(formData.get('thumbnailUrl') ?? '').trim()
    const thumbnail_url = thumbnail_url_raw || null
    const cleanup_thumbnail_paths = parse_cleanup_paths(formData.get('cleanupThumbnailPaths'))

    if (!title || !content) {
        return { error: 'タイトルと本文は必須です' }
    }

    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        return auth
    }

    const supabase = createAdminClient()

    const post_id = isValidArticleId(post_id_raw) ? post_id_raw : generate_id(14)
    const preview_token = generate_id(24)
    const read_time = set_read_time(content)

    const { data, error } = await supabase
        .from('posts')
        .insert({
            author_id: auth.userId,
            post_id,
            preview_token,
            title,
            content,
            read_time,
            thumbnail_url,
            published: false,
            approval_status: 'pending',
        })
        .select('preview_token')
        .single()

    if (error || !data?.preview_token) {
        return { error: error?.message ?? '投稿に失敗しました' }
    }

    await cleanup_thumbnail_on_create(post_id, cleanup_thumbnail_paths)

    redirect(`/preview?article=${data.preview_token}`)
}

export async function updatePost(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const post_id = String(formData.get('postId') ?? '')
    const title = String(formData.get('title') ?? '').trim()
    const content = String(formData.get('content') ?? '').trim()
    const thumbnail_url_raw = String(formData.get('thumbnailUrl') ?? '').trim()
    const next_thumbnail_url = thumbnail_url_raw || null
    const cleanup_thumbnail_paths = parse_cleanup_paths(formData.get('cleanupThumbnailPaths'))

    if (!isValidArticleId(post_id)) {
        return { error: '投稿IDが不正です' }
    }

    if (!title || !content) {
        return { error: 'タイトルと本文を入力してください' }
    }

    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        return auth
    }

    const admin = createAdminClient()
    const read_time = set_read_time(content)
    const { data: post } = await admin
        .from('posts')
        .select('author_id, thumbnail_url')
        .eq('post_id', post_id)
        .single()

    if (!post || post.author_id !== auth.userId) {
        return { error: '編集権限がありません' }
    }

    const { error } = await admin
        .from('posts')
        .update({ title, content, read_time, thumbnail_url: next_thumbnail_url })
        .eq('post_id', post_id)

    if (error) {
        return { error: error.message ?? '更新に失敗しました' }
    }

    await cleanup_thumbnail_on_update(
        post_id,
        cleanup_thumbnail_paths,
        post.thumbnail_url,
        next_thumbnail_url,
    )

    const account = await getCurrentUserAccountId()
    if (isActionError(account)) {
        return account
    }

    redirect(`/${account.accountId}/${post_id}`)
}

export async function deletePost(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const post_id = String(formData.get('postId') ?? '')

    if (!isValidArticleId(post_id)) {
        return { error: '投稿IDが不正です' }
    }

    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        return auth
    }

    const admin = createAdminClient()
    const { data: post } = await admin
        .from('posts')
        .select('author_id, thumbnail_url')
        .eq('post_id', post_id)
        .single()

    if (!post || post.author_id !== auth.userId) {
        return { error: '削除権限がありません' }
    }

    const { error } = await admin.from('posts').delete().eq('post_id', post_id)

    if (error) {
        return { error: error.message ?? '投稿削除に失敗しました' }
    }

    await cleanup_thumbnail_on_delete(post_id, post.thumbnail_url)

    const account = await getCurrentUserAccountId()
    if (isActionError(account)) {
        return account
    }

    redirect(`/${account.accountId}`)
}
