export interface Article {
    slug: string
    title: string
    description: string
    readTime: string
    date: string
    thumbnail?: string
}

export interface ArticleWithContent extends Article {
    content: string
}

export interface PageProps {
    params: Promise<{ slug: string }>
}