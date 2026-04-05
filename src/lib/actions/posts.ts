'use server'

import crypto from 'node:crypto'
import { redirect } from 'next/navigation'
import {
    getAuthenticatedUserId,
    getCurrentUserAccountId,
    isActionError,
} from '@/lib/actions/action-context'
import { isValidArticleId } from '@/lib/article-id'
import { set_read_time } from '@/lib/read-time'
import { createAdminClient } from '@/lib/supabase/server'

type ActionState = {
    error?: string
}

const generate_id = (length: number) => {
    return crypto.randomBytes(length).toString('base64url').slice(0, length)
}

export async function createPost(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const title = String(formData.get('title') ?? '').trim()
    const content = String(formData.get('content') ?? '').trim()
    const thumbnail_url_raw = String(formData.get('thumbnailUrl') ?? '').trim()
    const thumbnail_url = thumbnail_url_raw || null

    if (!title || !content) {
        return { error: 'タイトルと本文は必須です' }
    }

    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        return auth
    }

    const supabase = createAdminClient()

    const article_id = generate_id(14)
    const preview_token = generate_id(24)
    const read_time = set_read_time(content)

    const { data, error } = await supabase
        .from('posts')
        .insert({
            author_id: auth.userId,
            article_id,
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

    redirect(`/preview?article=${data.preview_token}`)
}

export async function updatePost(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const article_id = String(formData.get('articleId') ?? '')
    const title = String(formData.get('title') ?? '').trim()
    const content = String(formData.get('content') ?? '').trim()

    if (!isValidArticleId(article_id)) {
        return { error: '記事IDが不正です' }
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
        .select('author_id')
        .eq('article_id', article_id)
        .single()

    if (!post || post.author_id !== auth.userId) {
        return { error: '編集権限がありません' }
    }

    const { error } = await admin
        .from('posts')
        .update({ title, content, read_time })
        .eq('article_id', article_id)

    if (error) {
        return { error: error.message ?? '更新に失敗しました' }
    }

    const account = await getCurrentUserAccountId()
    if (isActionError(account)) {
        return account
    }

    redirect(`/${account.accountId}/notes/${article_id}`)
}

export async function deletePost(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const article_id = String(formData.get('articleId') ?? '')

    if (!isValidArticleId(article_id)) {
        return { error: '記事IDが不正です' }
    }

    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        return auth
    }

    const admin = createAdminClient()
    const { data: post } = await admin
        .from('posts')
        .select('author_id')
        .eq('article_id', article_id)
        .single()

    if (!post || post.author_id !== auth.userId) {
        return { error: '削除権限がありません' }
    }

    const { error } = await admin.from('posts').delete().eq('article_id', article_id)

    if (error) {
        return { error: error.message ?? '記事削除に失敗しました' }
    }

    const account = await getCurrentUserAccountId()
    if (isActionError(account)) {
        return account
    }

    redirect(`/${account.accountId}`)
}
