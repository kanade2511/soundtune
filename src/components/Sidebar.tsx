import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { getLatestPublishedPosts } from '@/lib/articles'

const get_read_time = (content: string) => {
    const length = content.replace(/\s+/g, '').length
    const minutes = Math.max(1, Math.ceil(length / 500))
    return `${minutes}分`
}

const format_date = (value: string) => {
    return new Date(value).toLocaleDateString('ja-JP')
}

const Sidebar = async () => {
    const latest_articles = await getLatestPublishedPosts(5)

    return (
        <div className='space-y-6'>
            <div className='hidden lg:block'>
                {/* 最新記事カード */}
                <div className='bg-white rounded-lg shadow-md p-6 sticky top-24'>
                    <h3 className='text-xl font-bold text-gray-800 mb-4'>最新記事</h3>
                    <div className='space-y-4'>
                        {latest_articles
                            .filter(article => article.account_id)
                            .map(article => (
                                <Link
                                    key={article.article_id}
                                    href={`/${article.account_id}/notes/${article.article_id}`}
                                    className='block group'
                                >
                                    <div className='border-b border-gray-100 pb-3 last:border-b-0'>
                                        <h4 className='text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2'>
                                            {article.title}
                                        </h4>
                                        <div className='flex items-center space-x-3 text-xs text-gray-500'>
                                            <div className='flex items-center space-x-1'>
                                                <Calendar className='h-3 w-3' />
                                                <span>{format_date(article.created_at)}</span>
                                            </div>
                                            <div className='flex items-center space-x-1'>
                                                <Clock className='h-3 w-3' />
                                                <span>{get_read_time(article.content)}</span>
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
    )
}

export default Sidebar
