import Breadcrumb from '@/components/Breadcrumb'
import Card from '@/components/Card'
import { getAllArticles } from '@/lib/articles'
import { FileText } from 'lucide-react'
import Link from 'next/link'

const NotesPage = async () => {
    const articles = await getAllArticles()

    return (
        <div className='min-h-screen'>
            <div className='container mx-auto px-4 py-8 max-w-4xl'>
                {/* Breadcrumb */}
                <Breadcrumb items={[{ label: '音楽ノート一覧' }]} />

                {/* Header */}
                <div className='mb-8'>
                    <div className='flex items-center space-x-2 mb-4'>
                        <FileText className='h-6 w-6 text-blue-600' />
                        <span className='text-sm font-medium text-blue-600'>音楽ノート</span>
                    </div>

                    <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight'>
                        音楽ノート一覧
                    </h1>

                    <p className='text-xl text-gray-600 mb-6'>
                        楽器や機材の使い方に関する様々なガイドとチュートリアル
                    </p>
                </div>

                {/* Notes List */}
                <div className='grid gap-6 md:grid-cols-2 mb-12'>
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

                {/* Navigation */}
                <div className='pt-8 border-t border-gray-200'>
                    <Link
                        href='/'
                        className='inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-medium'
                    >
                        <span>ホームに戻る</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default NotesPage
