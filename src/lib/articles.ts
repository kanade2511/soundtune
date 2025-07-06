import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { Article, ArticleWithContent, TagInfo } from './types'

const ARTICLES_DIR = path.join(process.cwd(), 'src', 'notes')

const getMarkdownFiles = async (): Promise<string[]> => {
    const filenames = await fs.readdir(ARTICLES_DIR)
    return filenames.filter(name => name.endsWith('.md'))
}

const parseMarkdownFile = async (
    filename: string,
    includeContent = false,
): Promise<Article | ArticleWithContent> => {
    const filePath = path.join(ARTICLES_DIR, filename)
    const fileContent = await fs.readFile(filePath, 'utf8')
    const { data, content } = matter(fileContent)

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

    if (includeContent) {
        return { ...article, content } as ArticleWithContent
    }

    return article
}

export const getAllArticles = async (): Promise<Article[]> => {
    const markdownFiles = await getMarkdownFiles()
    const articles: Article[] = []

    for (const filename of markdownFiles) {
        const article = await parseMarkdownFile(filename)
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

export const getArticlesByTag = async (tagSlug: string): Promise<Article[]> => {
    const articles = await getAllArticles()
    const decodedTagSlug = decodeURIComponent(tagSlug)

    return articles.filter(article => article.tags.includes(decodedTagSlug))
}

export const searchArticles = async (query: string): Promise<ArticleWithContent[]> => {
    const markdownFiles = await getMarkdownFiles()
    const articles: ArticleWithContent[] = []
    const searchTerm = query.toLowerCase()

    for (const filename of markdownFiles) {
        const article = (await parseMarkdownFile(filename, true)) as ArticleWithContent

        if (article.title.toLowerCase().includes(searchTerm)) {
            articles.push(article)
        }
    }

    return articles
}

export const getAllTags = async (): Promise<TagInfo[]> => {
    const articles = await getAllArticles()
    const tagCounts: Record<string, number> = {}

    for (const article of articles) {
        for (const tag of article.tags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
        }
    }

    return Object.entries(tagCounts).map(([tag, count]) => ({
        slug: encodeURIComponent(tag),
        displayName: tag,
        count,
    }))
}
