import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { Article, ArticleWithContent, TagInfo } from './types'

const articles_dir = path.join(process.cwd(), 'src', 'notes')

const get_markdown_files = async (): Promise<string[]> => {
    const filenames = await fs.readdir(articles_dir)
    return filenames.filter(name => name.endsWith('.md'))
}

const parse_markdown_file = async (
    filename: string,
    include_content = false,
): Promise<Article | ArticleWithContent> => {
    const file_path = path.join(articles_dir, filename)
    const file_content = await fs.readFile(file_path, 'utf8')
    const { data, content } = matter(file_content)

    const slug = filename.replace('.md', '')

    const article: Article = {
        slug,
        title: data.title || 'タイトル',
        category: data.category || '一般',
        description: data.description || '説明文',
        readTime: data.readTime || '5分',
        date: data.date || '2025-07-04',
        tags: data.tags || [],
        thumbnail: data.thumbnail || undefined,
    }

    if (include_content) {
        return { ...article, content } as ArticleWithContent
    }

    return article
}

export const getAllArticles = async (): Promise<Article[]> => {
    const markdown_files = await get_markdown_files()
    const articles: Article[] = []

    for (const filename of markdown_files) {
        const article = await parse_markdown_file(filename)
        articles.push(article as Article)
    }

    // 日付順にソート（新しい順）
    articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return articles
}

export const getLatestArticles = async (limit = 5): Promise<Article[]> => {
    const articles = await getAllArticles()
    return articles.slice(0, limit)
}

export const getArticlesByTag = async (tag_slug: string): Promise<Article[]> => {
    const articles = await getAllArticles()
    const decoded_tag_slug = decodeURIComponent(tag_slug)

    return articles.filter(article => article.tags.includes(decoded_tag_slug))
}

export const searchArticles = async (query: string): Promise<ArticleWithContent[]> => {
    const markdown_files = await get_markdown_files()
    const articles: ArticleWithContent[] = []
    const search_term = query.toLowerCase()

    for (const filename of markdown_files) {
        const article = (await parse_markdown_file(filename, true)) as ArticleWithContent

        if (article.title.toLowerCase().includes(search_term)) {
            articles.push(article)
        }
    }

    return articles
}

export const getAllTags = async (): Promise<TagInfo[]> => {
    const articles = await getAllArticles()
    const tag_counts: Record<string, number> = {}

    for (const article of articles) {
        for (const tag of article.tags) {
            tag_counts[tag] = (tag_counts[tag] || 0) + 1
        }
    }

    return Object.entries(tag_counts).map(([tag, count]) => ({
        slug: encodeURIComponent(tag),
        displayName: tag,
        count,
    }))
}
