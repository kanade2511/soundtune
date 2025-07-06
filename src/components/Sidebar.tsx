import { getLatestArticles } from '@/lib/articles'
import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { SearchBox } from './SearchBox'

const Sidebar = async () => {
    const latestArticles = await getLatestArticles(5)

    return (
        <div className='space-y-6'>
            {/* 検索ボックスカード */}
            <div className='bg-white rounded-lg shadow-md p-6 mt-14'>
                <SearchBox variant='sidebar' title='記事を検索' />
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
