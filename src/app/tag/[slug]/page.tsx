import Card from '@/components/Card'
import { getArticlesByTag } from '@/lib/articles'
import type { PageProps } from '@/lib/types'
import { ArrowLeft, Tag } from 'lucide-react'
import Link from 'next/link'

const TagPage = async ({ params }: PageProps) => {
    const { slug } = await params
    const articles = await getArticlesByTag(slug)
    const tagDisplayName = decodeURIComponent(slug)

    return (
        <div className='min-h-screen'>
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
