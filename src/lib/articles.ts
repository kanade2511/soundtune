import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type { Article, ArticleWithContent } from './types'

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
        description: data.description || '説明文',
        readTime: data.readTime || '5分',
        date: data.date || '2025-07-04',
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

// タグによる記事取得は削除

// 検索機能削除

// タグ一覧取得も削除
