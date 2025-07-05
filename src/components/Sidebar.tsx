import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { Calendar, Clock, Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { SidebarSearchBox } from './SidebarSearchBox'

interface Article {
    slug: string
    title: string
    category: string
    date: string
    readTime: string
}

const getLatestArticles = async (): Promise<Article[]> => {
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
            date: data.date || '2025-07-04',
            readTime: data.readTime || '5分',
        })
    }

    // 日付順にソート（新しい順）
    articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return articles.slice(0, 5) // 最新5記事
}

const Sidebar = async () => {
    const latestArticles = await getLatestArticles()

    return (
        <div className='lg:col-span-1 space-y-6'>
            {/* 検索ボックスカード */}
            <div className='bg-white rounded-lg shadow-md p-6'>
                <SidebarSearchBox />
            </div>

            {/* 最新記事カード */}
            <div className='bg-white rounded-lg shadow-md p-6 sticky top-24'>
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
    )
}

export default Sidebar
