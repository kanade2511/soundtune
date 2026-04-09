import { requireAdminUserId } from '@/lib/actions/action-context'
import { createAdminClient } from '@/lib/supabase/server'
import PostReviewActions from './post-review-actions'
import UserAdminRow from './user-admin-row'

type UserRow = {
    id: string
    display_name: string | null
    account_id: string | null
    role: 'member' | 'admin' | null
    created_at: string
}

type PostRow = {
    article_id: string
    preview_token: string | null
    title: string
    created_at: string
    approval_status: 'pending' | 'approved' | 'rejected'
    profiles: { display_name: string | null; account_id: string | null } | null
}

const ConsolePage = async () => {
    const { userId } = await requireAdminUserId()

    const admin = createAdminClient()
    const { data: users } = await admin
        .from('profiles')
        .select('id, display_name, account_id, role, created_at')
        .order('created_at', { ascending: false })

    const { data: posts } = await admin
        .from('posts')
        .select(
            'article_id, preview_token, title, created_at, approval_status, profiles!author_id (display_name, account_id)',
        )
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })

    const user_list = (users ?? []) as UserRow[]
    const review_list: PostRow[] = (posts ?? []).map(post => {
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
        return {
            ...post,
            profiles: profile ?? null,
        }
    })

    return (
        <div className='space-y-8'>
            <div>
                <h1 className='text-2xl font-bold text-gray-800'>管理コンソール</h1>
                <p className='mt-2 text-sm text-gray-600'>レビューとユーザー管理ができます。</p>
            </div>

            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700'>
                管理者はレビューとユーザー管理が可能です。
            </div>

            <section className='space-y-4'>
                <div>
                    <h2 className='text-xl font-bold text-gray-800'>レビュー待ち</h2>
                    <p className='mt-1 text-sm text-gray-600'>承認待ちの記事を確認できます。</p>
                </div>

                {review_list.length === 0 ? (
                    <div className='rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600'>
                        現在、承認待ちの記事はありません。
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {review_list.map(post => (
                            <div
                                key={post.article_id}
                                className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
                            >
                                <div className='flex flex-wrap items-center justify-between gap-3'>
                                    <div className='space-y-1'>
                                        <p className='text-xs font-semibold uppercase tracking-wide text-blue-600'>
                                            Pending
                                        </p>
                                        <h3 className='text-lg font-semibold text-gray-800'>
                                            {post.title}
                                        </h3>
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
            </section>

            <section className='space-y-4'>
                <div>
                    <h2 className='text-xl font-bold text-gray-800'>ユーザー管理</h2>
                    <p className='mt-1 text-sm text-gray-600'>
                        ユーザーの削除と権限変更ができます。
                    </p>
                </div>

                {user_list.length === 0 ? (
                    <div className='rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600'>
                        ユーザーが見つかりません。
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {user_list.map(user => (
                            <UserAdminRow
                                key={user.id}
                                userId={user.id}
                                displayName={user.display_name ?? 'user'}
                                accountId={user.account_id ?? 'unknown'}
                                role={(user.role ?? 'member') as 'member' | 'admin'}
                                createdAt={user.created_at}
                                isSelf={user.id === userId}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

export default ConsolePage
