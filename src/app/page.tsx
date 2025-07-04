import { promises as fs } from 'node:fs'
import path from 'node:path'
import Card from '@/components/Card'
import matter from 'gray-matter'
import { Calendar, Clock } from 'lucide-react'
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
            date: data.date || '2025-07-04',
            tags: data.tags || [],
        })
    }

    // 日付順にソート（新しい順）
    articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return articles
}

const Home = async () => {
    const articles = await getArticles()
    const latestArticles = articles.slice(0, 5) // 最新5記事

    return (
        <div className='min-h-screen bg-gray-50'>
            {/* Main Content */}
            <main className='container mx-auto px-4 py-12'>
                {/* Header */}
                <div className='text-center mb-12'>
                    <h2 className='text-4xl font-bold text-gray-800 mb-4'>
                        音楽ノート & 楽器ガイド
                    </h2>
                    <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
                        楽器の使い方や音楽機器の操作方法を分かりやすいノートで解説します
                    </p>
                </div>

                {/* 2カラムレイアウト */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                    {/* メインコンテンツ（2/3） */}
                    <div className='lg:col-span-2'>
                        <h3 className='text-2xl font-bold text-gray-800 mb-6'>すべての記事</h3>
                        <div className='grid gap-6 md:grid-cols-2'>
                            {articles.map(article => (
                                <Card
                                    key={article.slug}
                                    slug={article.slug}
                                    title={article.title}
                                    category={article.category}
                                    description={article.description}
                                    readTime={article.readTime}
                                    date={article.date}
                                    tags={article.tags}
                                />
                            ))}
                        </div>
                    </div>

                    {/* サイドバー（1/3） */}
                    <div className='lg:col-span-1'>
                        <div className='bg-white rounded-lg shadow-md p-6 sticky top-8'>
                            <h3 className='text-xl font-bold text-gray-800 mb-4'>最新記事</h3>
                            <div className='space-y-4'>
                                {latestArticles.map(article => (
                                    <Link
                                        key={article.slug}
                                        href={`/notes/${article.slug}`}
                                        className='block group'
                                    >
                                        <div className='border-b border-gray-100 pb-3 last:border-b-0'>
                                            <div className='flex items-center space-x-2 mb-2'>
                                                <span className='text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full'>
                                                    {article.category}
                                                </span>
                                            </div>
                                            <h4 className='text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2'>
                                                {article.title}
                                            </h4>
                                            <div className='flex items-center space-x-3 text-xs text-gray-500'>
                                                <div className='flex items-center space-x-1'>
                                                    <Calendar className='h-3 w-3' />
                                                    <span>{article.date}</span>
                                                </div>
                                                <div className='flex items-center space-x-1'>
                                                    <Clock className='h-3 w-3' />
                                                    <span>{article.readTime}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* すべての記事を見るリンク */}
                            <div className='mt-4 pt-4 border-t border-gray-200'>
                                <Link
                                    href='/'
                                    className='text-sm text-blue-600 hover:text-blue-800 font-medium'
                                >
                                    すべての記事を見る →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Home
