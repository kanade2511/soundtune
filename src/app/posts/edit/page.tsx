import { redirect } from 'next/navigation'
import { getAuthenticatedUserId, isActionError } from '@/lib/actions/action-context'
import { isValidArticleId } from '@/lib/article-id'
import { createAdminClient } from '@/lib/supabase/server'
import EditPostForm from './edit-post-form'

type PageProps = {
    searchParams: Promise<{ postId?: string }>
}

const EditPostPage = async ({ searchParams }: PageProps) => {
    const params = await searchParams
    const post_id = params.postId

    if (!post_id || !isValidArticleId(post_id)) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                投稿IDが不正です
            </div>
        )
    }

    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        redirect('/auth/login')
    }

    const admin = createAdminClient()
    const { data: post } = await admin
        .from('posts')
        .select('title, content, author_id, thumbnail_url')
        .eq('post_id', post_id)
        .single()

    if (!post) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                投稿が見つかりません
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
            <EditPostForm
                postId={post_id}
                initialTitle={post.title}
                initialContent={post.content}
                initialThumbnailUrl={post.thumbnail_url}
            />
        </div>
    )
}

export default EditPostPage
