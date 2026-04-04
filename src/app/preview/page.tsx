import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'

type PreviewPageProps = {
    searchParams: Promise<{ article?: string }>
}

const PreviewPage = async ({ searchParams }: PreviewPageProps) => {
    const params = await searchParams
    const preview_token = params.article

    if (!preview_token) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                プレビュートークンが指定されていません
            </div>
        )
    }

    const supabase = createAdminClient()
    const { data: post } = await supabase
        .from('posts')
        .select(
            'article_id, title, content, created_at, approval_status, published, profiles!author_id (display_name, account_id, avatar_url)',
        )
        .eq('preview_token', preview_token)
        .single()

    if (!post) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                記事が見つかりません
            </div>
        )
    }

    const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles

    if (post.approval_status === 'approved' && post.published && profile?.account_id) {
        redirect(`/${profile.account_id}/notes/${post.article_id}`)
    }

    return (
        <div className='space-y-6'>
            <div className='space-y-2'>
                <p className='text-xs font-semibold uppercase tracking-wide text-blue-600'>
                    Preview
                </p>
                <h1 className='text-2xl font-bold text-gray-800'>{post.title}</h1>
                <div className='flex flex-wrap items-center gap-2 text-sm text-gray-500'>
                    <span>
                        {profile?.display_name ?? 'user'}
                        {profile?.account_id ? ` (@${profile.account_id})` : ''}
                    </span>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                    <span>•</span>
                    <span>{post.approval_status}</span>
                </div>
            </div>

            <article className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
                <div className='whitespace-pre-wrap text-gray-800'>{post.content}</div>
            </article>
        </div>
    )
}

export default PreviewPage
