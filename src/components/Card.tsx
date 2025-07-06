'use client'

import { Calendar, Clock, Loader } from 'lucide-react'
import Link from 'next/link'

interface CardProps {
    slug: string
    title: string
    category: string
    description?: string
    readTime: string
    date: string
    tags: string[]
    thumbnail?: string
}

const Card = ({
    slug,
    title,
    category,
    description,
    readTime,
    date,
    tags,
    thumbnail,
}: CardProps) => {
    return (
        <div className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden'>
            {' '}
            <Link href={`/notes/${slug}`} className='block'>
                {/* 画像エリア */}
                <div className='relative h-48'>
                    <div className='absolute inset-0 bg-white bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] rounded z-10'>
                        <div className='absolute bottom-3 right-3 z-5'>
                            <Loader className='h-6 w-6 text-gray-400 animate-spin' />
                        </div>
                        {thumbnail && (
                            <img
                                src={thumbnail}
                                alt={title}
                                className='absolute inset-0 w-full h-full object-cover z-10'
                            />
                        )}
                        {/* カテゴリラベル */}
                        <div className='absolute top-3 left-3 z-20'>
                            <span className='text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full'>
                                {category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* カードコンテンツ */}
                <div className='p-4'>
                    {/* タイトル */}
                    <h3 className='text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors'>
                        {title}
                    </h3>

                    {/* 説明文 */}
                    {description && (
                        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>{description}</p>
                    )}

                    {/* 日付と読了時間 */}
                    <div className='flex items-center justify-between text-xs text-gray-500'>
                        <div className='flex items-center space-x-1'>
                            <Calendar className='h-3 w-3' />
                            <span>{date}</span>
                        </div>
                        <div className='flex items-center space-x-1'>
                            <Clock className='h-3 w-3' />
                            <span>{readTime}</span>
                        </div>
                    </div>
                </div>
            </Link>
            {/* タグ */}
            {tags.length > 0 && (
                <div className='px-4 pb-4'>
                    <div className='flex flex-wrap gap-1'>
                        {tags.slice(0, 3).map(tag => (
                            <Link
                                key={tag}
                                href={`/tag/${encodeURIComponent(tag)}`}
                                className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors'
                                onClick={e => e.stopPropagation()}
                            >
                                # {tag}
                            </Link>
                        ))}
                        {tags.length > 3 && (
                            <span className='text-xs text-gray-400 px-2 py-1'>
                                +{tags.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Card
