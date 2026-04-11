import Link from 'next/link'
import {
    getAuthenticatedUserId,
    getCurrentUserAccountId,
    isActionError,
} from '@/lib/actions/action-context'
import { isValidArticleId } from '@/lib/article-id'
import { createAdminClient } from '@/lib/supabase/server'
import PostForm from './form'

type PageProps = {
    params: Promise<{ account_id: string; posts_id: string }>
}

const PostEditPage = async ({ params }: PageProps) => {
    const { account_id, posts_id } = await params
    const post_id = posts_id

    if (!isValidArticleId(post_id)) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                投稿IDが不正です
            </div>
        )
    }

    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        return (
            <div className='space-y-2 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                <p>編集にはログインが必要です</p>
                <Link
                    href={`/auth/login?next=/${account_id}/${post_id}/edit`}
                    className='inline-block text-sm font-semibold text-blue-700 underline'
                >
                    ログインへ
                </Link>
            </div>
        )
    }

    const account = await getCurrentUserAccountId()
    if (isActionError(account)) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                プロフィールが見つかりません
            </div>
        )
    }

    if (account.accountId !== account_id) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                編集権限がありません
            </div>
        )
    }

    const admin = createAdminClient()
    const { data: post } = await admin
        .from('posts')
        .select('title, content, author_id, thumbnail_url')
        .eq('post_id', post_id)
        .single()

    if (!post) {
        return (
            <div className='space-y-6'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-800'>新規投稿</h1>
                    <p className='mt-2 text-sm text-gray-600'>タイトルと本文を入力してください。</p>
                </div>
                <PostForm mode='new' postId={post_id} />
            </div>
        )
    }

    if (post.author_id !== auth.userId) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                編集権限がありません
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-2xl font-bold text-gray-800'>投稿を編集</h1>
                <p className='mt-2 text-sm text-gray-600'>タイトルと本文を更新してください。</p>
            </div>
            <PostForm
                mode='edit'
                postId={post_id}
                initialTitle={post.title}
                initialContent={post.content}
                initialThumbnailUrl={post.thumbnail_url}
            />
        </div>
    )
}

export default PostEditPage
