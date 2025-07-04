'use client'

import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

interface CardProps {
    slug: string
    title: string
    category: string
    description?: string
    readTime: string
    date: string
    tags: string[]
    imageUrl?: string
    showSnippet?: boolean
    snippet?: string
    highlightQuery?: string
}

const Card = ({
    slug,
    title,
    category,
    description,
    readTime,
    date,
    tags,
    imageUrl = 'https://picsum.photos/300/200',
    showSnippet = false,
    snippet,
    highlightQuery,
}: CardProps) => {
    const highlightText = (text: string, query?: string): string => {
        if (!query) return text
        const regex = new RegExp(`(${query})`, 'gi')
        return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
    }

    return (
        <div className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden'>
            <Link href={`/notes/${slug}`} className='block'>
                {/* 画像エリア */}
                <div className='relative'>
                    <img src={imageUrl} alt={title} className='w-full h-48 object-cover' />
                    {/* カテゴリラベル */}
                    <div className='absolute top-3 left-3'>
                        <span className='bg-black text-white text-xs font-medium px-2 py-1 rounded'>
                            {category}
                        </span>
                    </div>
                </div>

                {/* カードコンテンツ */}
                <div className='p-4'>
                    {/* タイトル */}
                    <h3
                        className='text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors'
                        dangerouslySetInnerHTML={{
                            __html: highlightText(title, highlightQuery),
                        }}
                    />

                    {/* 説明文 */}
                    {description && (
                        <p
                            className='text-sm text-gray-600 mb-3 line-clamp-2'
                            dangerouslySetInnerHTML={{
                                __html: highlightText(description, highlightQuery),
                            }}
                        />
                    )}

                    {/* スニペット（検索結果用） */}
                    {showSnippet && snippet && snippet !== description && (
                        <div
                            className='text-sm text-gray-500 mb-3 italic line-clamp-2'
                            dangerouslySetInnerHTML={{
                                __html: highlightText(snippet, highlightQuery),
                            }}
                        />
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
                                #{tag}
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
