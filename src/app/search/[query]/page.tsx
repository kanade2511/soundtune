import Card from '@/components/Card'
import { searchArticles } from '@/lib/articles'
import type { SearchPageProps } from '@/lib/types'
import { ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'

const SearchPage = async ({ params }: SearchPageProps) => {
    const { query } = await params
    const decodedQuery = decodeURIComponent(query)
    const articles = await searchArticles(decodedQuery)

    return (
        <div className='min-h-screen'>
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
                                thumbnail={article.thumbnail}
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
