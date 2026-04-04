import { redirect } from 'next/navigation'
import { getAuthenticatedUserId, isActionError } from '@/lib/actions/action-context'
import { isValidArticleId } from '@/lib/article-id'
import { createAdminClient } from '@/lib/supabase/server'
import EditPostForm from './edit-post-form'

type PageProps = {
    searchParams: Promise<{ articleId?: string }>
}

const EditPostPage = async ({ searchParams }: PageProps) => {
    const params = await searchParams
    const article_id = params.articleId

    if (!article_id || !isValidArticleId(article_id)) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                記事IDが不正です
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
        .select('title, content, author_id')
        .eq('article_id', article_id)
        .single()

    if (!post) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                記事が見つかりません
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
                <h1 className='text-2xl font-bold text-gray-800'>記事を編集</h1>
                <p className='mt-2 text-sm text-gray-600'>タイトルと本文を更新してください。</p>
            </div>
            <EditPostForm
                articleId={article_id}
                initialTitle={post.title}
                initialContent={post.content}
            />
        </div>
    )
}

export default EditPostPage
