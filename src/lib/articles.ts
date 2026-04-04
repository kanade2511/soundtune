import { createAdminClient } from './supabase/server'

type PublishedPostRow = {
    article_id: string
    title: string
    content: string
    created_at: string
    profiles: { account_id: string } | { account_id: string }[] | null
}

type PublishedPost = {
    article_id: string
    title: string
    content: string
    created_at: string
    account_id: string | null
}

export const getPublishedPosts = async (): Promise<PublishedPost[]> => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('posts')
        .select('article_id, title, content, created_at, profiles:profiles!author_id (account_id)')
        .eq('published', true)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })

    if (error) {
        return []
    }

    return (data ?? []).map((post: PublishedPostRow) => {
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
        return {
            article_id: post.article_id,
            title: post.title,
            content: post.content,
            created_at: post.created_at,
            account_id: profile?.account_id ?? null,
        }
    })
}

export const getLatestPublishedPosts = async (limit = 5): Promise<PublishedPost[]> => {
    const posts = await getPublishedPosts()
    return posts.slice(0, limit)
}
