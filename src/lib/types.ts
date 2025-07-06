export interface Article {
    slug: string
    title: string
    category: string
    description: string
    readTime: string
    date: string
    tags: string[]
}

export interface ArticleWithContent extends Article {
    content: string
}

export interface TagInfo {
    slug: string
    displayName: string
    count: number
}

export interface PageProps {
    params: Promise<{ slug: string }>
}

export interface SearchPageProps {
    params: { query: string }
}
