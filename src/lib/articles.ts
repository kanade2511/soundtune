import { createAdminClient } from './supabase/server'

type PublishedPostRow = {
    article_id: string
    title: string
    content: string
    created_at: string
    read_time: number
    thumbnail_url: string | null
    profiles:
        | { account_id: string; display_name: string | null }
        | { account_id: string; display_name: string | null }[]
        | null
}

type PublishedPost = {
    article_id: string
    title: string
    content: string
    created_at: string
    read_time: number
    account_id: string | null
    display_name: string | null
    thumbnail_url: string | null
}

export const getPublishedPosts = async (): Promise<PublishedPost[]> => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('posts')
        .select(
            'article_id, title, content, created_at, read_time, thumbnail_url, profiles:profiles!author_id (account_id, display_name)',
        )
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
            read_time: post.read_time,
            account_id: profile?.account_id ?? null,
            display_name: profile?.display_name ?? null,
            thumbnail_url: post.thumbnail_url,
        }
    })
}

export const getLatestPublishedPosts = async (limit = 5): Promise<PublishedPost[]> => {
    const posts = await getPublishedPosts()
    return posts.slice(0, limit)
}
