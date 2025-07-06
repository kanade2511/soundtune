import { promises as fs } from 'node:fs'
import path from 'node:path'
import Card from '@/components/Card'
import matter from 'gray-matter'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'

interface Article {
    slug: string
    title: string
    category: string
    description: string
    readTime: string
    date: string
    tags: string[]
    content: string
}

const searchArticles = async (query: string): Promise<Article[]> => {
    const articlesDir = path.join(process.cwd(), 'src', 'notes')
    const filenames = await fs.readdir(articlesDir)
    const markdownFiles = filenames.filter(name => name.endsWith('.md'))

    const articles: Article[] = []
    const searchTerm = query.toLowerCase()

    for (const filename of markdownFiles) {
        const filePath = path.join(articlesDir, filename)
        const fileContent = await fs.readFile(filePath, 'utf8')
        const { data, content } = matter(fileContent)

        const slug = filename.replace('.md', '')
        const title = data.title || 'タイトル'
        const description = data.description || '説明文'
        const category = data.category || '一般'
        const tags = data.tags || []

        // 検索条件: タイトルのみ
        if (title.toLowerCase().includes(searchTerm)) {
            articles.push({
                slug,
                title,
                category,
                description,
                readTime: data.readTime || '5分',
                date: data.date || '2025-07-04',
                tags,
                content,
            })
        }
    }

    return articles
}

interface PageProps {
    params: { query: string }
}

const SearchPage = async ({ params }: PageProps) => {
    const decodedQuery = decodeURIComponent(params.query)
    const articles = await searchArticles(decodedQuery)

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50'>
            <div className='container mx-auto px-4 py-8 max-w-6xl'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='flex items-center space-x-2 mb-4'>
                        <Search className='h-6 w-6 text-blue-600' />
                        <span className='text-sm font-medium text-blue-600'>検索結果</span>
                    </div>

                    <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight'>
                        「{decodedQuery}」の検索結果
                    </h1>

                    <p className='text-xl text-gray-600 mb-6'>
                        {articles.length}件の記事が見つかりました
                    </p>
                </div>

                {/* Search Results */}
                {articles.length > 0 ? (
                    <div className='space-y-6 mb-12'>
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
                ) : (
                    <div className='text-center py-12'>
                        <div className='mb-4'>
                            <Search className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                        </div>
                        <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                            検索結果が見つかりませんでした
                        </h3>
                        <p className='text-gray-500 mb-6'>
                            「{decodedQuery}」に関する記事は見つかりませんでした。
                            <br />
                            別のキーワードで検索してみてください。
                        </p>
                        <div className='space-y-2 text-sm text-gray-600'>
                            <p>検索のヒント:</p>
                            <ul className='list-disc list-inside space-y-1'>
                                <li>より一般的な単語を使用してみてください</li>
                                <li>スペルを確認してください</li>
                                <li>同義語や関連語句を試してみてください</li>
                            </ul>
                        </div>
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

export default SearchPage
