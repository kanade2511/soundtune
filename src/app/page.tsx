import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import Link from 'next/link'

interface Article {
    slug: string
    title: string
    category: string
    description: string
    readTime: string
    tags: string[]
}

const getArticles = async (): Promise<Article[]> => {
    const articlesDir = path.join(process.cwd(), 'src', 'notes')
    const filenames = await fs.readdir(articlesDir)
    const markdownFiles = filenames.filter(name => name.endsWith('.md'))

    const articles: Article[] = []

    for (const filename of markdownFiles) {
        const filePath = path.join(articlesDir, filename)
        const fileContent = await fs.readFile(filePath, 'utf8')
        const { data } = matter(fileContent)

        const slug = filename.replace('.md', '')

        articles.push({
            slug,
            title: data.title || 'タイトル',
            category: data.category || '一般',
            description: data.description || '説明文',
            readTime: data.readTime || '5分',
            tags: data.tags || [],
        })
    }

    return articles
}

const Home = async () => {
    const articles = await getArticles()

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
            {/* Main Content */}
            <main className='container mx-auto px-4 py-12'>
                <div className='text-center mb-12'>
                    <h2 className='text-4xl font-bold text-gray-800 mb-4'>
                        音楽ノート & 楽器ガイド
                    </h2>
                    <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
                        楽器の使い方や音楽機器の操作方法を分かりやすいノートで解説します
                    </p>
                </div>

                {/* Blog Posts */}
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
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
                                {article.tags.length > 0 && (
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
                                )}
                            </Link>
                        )
                    })}
                </div>
            </main>
        </div>
    )
}

export default Home
