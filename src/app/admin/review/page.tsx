import { redirect } from 'next/navigation'
import { getAuthenticatedUserId, isActionError } from '@/lib/actions/action-context'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import PostReviewActions from './post-review-actions'

type PostRow = {
    article_id: string
    preview_token: string | null
    title: string
    created_at: string
    approval_status: 'pending' | 'approved' | 'rejected'
    profiles: { display_name: string | null; account_id: string | null } | null
}

const ReviewPage = async () => {
    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        redirect('/auth/login')
    }

    const authClient = await createClient()
    const { data: profile } = await authClient
        .from('profiles')
        .select('role')
        .eq('id', auth.userId)
        .single()

    if (!profile || profile.role !== 'admin') {
        redirect('/')
    }

    const admin = createAdminClient()
    const { data: posts } = await admin
        .from('posts')
        .select(
            'article_id, preview_token, title, created_at, approval_status, profiles!author_id (display_name, account_id)',
        )
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })

    const list: PostRow[] = (posts ?? []).map(post => {
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
        return {
            ...post,
            profiles: profile ?? null,
        }
    })

    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-2xl font-bold text-gray-800'>レビュー待ち</h1>
                <p className='mt-2 text-sm text-gray-600'>承認待ちの記事を確認できます。</p>
            </div>

            {list.length === 0 ? (
                <div className='rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600'>
                    現在、承認待ちの記事はありません。
                </div>
            ) : (
                <div className='space-y-4'>
                    {list.map(post => (
                        <div
                            key={post.article_id}
                            className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
                        >
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <div className='space-y-1'>
                                    <p className='text-xs font-semibold uppercase tracking-wide text-blue-600'>
                                        Pending
                                    </p>
                                    <h2 className='text-lg font-semibold text-gray-800'>
                                        {post.title}
                                    </h2>
                                    <p className='text-sm text-gray-500'>
                                        {post.profiles?.display_name ?? 'user'}
                                        {post.profiles?.account_id
                                            ? ` (@${post.profiles.account_id})`
                                            : ''}
                                        <span className='mx-2'>•</span>
                                        {new Date(post.created_at).toLocaleDateString('ja-JP')}
                                    </p>
                                </div>
                                <PostReviewActions articleId={post.article_id} />
                            </div>
                            {post.preview_token ? (
                                <div className='mt-3 text-xs text-gray-500'>
                                    Preview token: {post.preview_token}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ReviewPage
