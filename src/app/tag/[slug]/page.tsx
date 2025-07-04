import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { ArrowLeft, FileText, Tag } from 'lucide-react'
import Link from 'next/link'

interface Article {
    slug: string
    title: string
    category: string
    description: string
    readTime: string
    date: string
    tags: string[]
}

const getArticlesByTag = async (tagSlug: string): Promise<Article[]> => {
    const articlesDir = path.join(process.cwd(), 'src', 'notes')
    const filenames = await fs.readdir(articlesDir)
    const markdownFiles = filenames.filter(name => name.endsWith('.md'))

    const articles: Article[] = []

    for (const filename of markdownFiles) {
        const filePath = path.join(articlesDir, filename)
        const fileContent = await fs.readFile(filePath, 'utf8')
        const { data } = matter(fileContent)

        const slug = filename.replace('.md', '')
        const tags = data.tags || []

        // 指定されたタグが含まれている記事のみを含める
        const decodedTagSlug = decodeURIComponent(tagSlug)
        if (tags.includes(decodedTagSlug)) {
            articles.push({
                slug,
                title: data.title || 'タイトル',
                category: data.category || '一般',
                description: data.description || '説明文',
                readTime: data.readTime || '5分',
                date: data.date || '2025-07-04',
                tags,
            })
        }
    }

    return articles
}

const getTagDisplayName = (tagSlug: string): string => {
    // 日本語タグをそのまま使用
    return decodeURIComponent(tagSlug)
}

interface PageProps {
    params: { slug: string }
}

const TagPage = async ({ params }: PageProps) => {
    const articles = await getArticlesByTag(params.slug)
    const tagDisplayName = getTagDisplayName(params.slug)

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50'>
            <div className='container mx-auto px-4 py-8 max-w-6xl'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='flex items-center space-x-2 mb-4'>
                        <Tag className='h-6 w-6 text-blue-600' />
                        <span className='inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full'>
                            {tagDisplayName}
                        </span>
                    </div>

                    <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight'>
                        「{tagDisplayName}」の記事
                    </h1>

                    <p className='text-xl text-gray-600 mb-6'>
                        {articles.length}件の記事があります
                    </p>
                </div>

                {/* Articles */}
                {articles.length > 0 ? (
                    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12'>
                        {articles.map(article => {
                            return (
                                <Link
                                    key={article.slug}
                                    href={`/notes/${article.slug}`}
                                    className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block group'
                                >
                                    <div className='flex items-center justify-between mb-4'>
                                        <div className='flex items-center'>
                                            <span className='text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full'>
                                                {article.category}
                                            </span>
                                        </div>
                                        <span className='text-sm text-gray-500'>
                                            {article.readTime}
                                        </span>
                                    </div>

                                    <h3 className='text-xl font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors'>
                                        {article.title}
                                    </h3>

                                    <p className='text-gray-600 mb-4 line-clamp-3'>
                                        {article.description}
                                    </p>

                                    {/* Tags */}
                                    <div className='flex flex-wrap gap-2 mb-4'>
                                        {article.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className='inline-flex items-center text-blue-600 group-hover:text-blue-800 font-medium'>
                                        <FileText className='h-4 w-4 mr-1' />
                                        記事を読む
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className='text-center py-12'>
                        <p className='text-gray-500 text-lg'>
                            このタグの記事は見つかりませんでした。
                        </p>
                    </div>
                )}

                {/* Navigation */}
                <div className='pt-8 border-t border-gray-200'>
                    <Link
                        href='/'
                        className='inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-medium'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        <span>ホームに戻る</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default TagPage
