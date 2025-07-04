'use client'

import { FileText } from 'lucide-react'
import Link from 'next/link'

interface ArticleCardProps {
    slug: string
    title: string
    category: string
    description: string
    readTime: string
    date: string
    tags: string[]
    showSnippet?: boolean
    snippet?: string
    highlightQuery?: string
}

const ArticleCard = ({
    slug,
    title,
    category,
    description,
    readTime,
    date,
    tags,
    showSnippet = false,
    snippet,
    highlightQuery,
}: ArticleCardProps) => {
    const highlightText = (text: string, query?: string): string => {
        if (!query) return text
        const regex = new RegExp(`(${query})`, 'gi')
        return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
    }

    return (
        <div className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow'>
            <Link href={`/notes/${slug}`} className='block p-6'>
                <div className='flex items-center justify-between mb-3'>
                    <span className='text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full'>
                        {category}
                    </span>
                    <span className='text-sm text-gray-500'>{readTime}</span>
                </div>

                <h3
                    className='text-xl font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors'
                    dangerouslySetInnerHTML={{
                        __html: highlightText(title, highlightQuery),
                    }}
                />

                <p
                    className='text-gray-600 mb-3'
                    dangerouslySetInnerHTML={{
                        __html: highlightText(description, highlightQuery),
                    }}
                />

                {showSnippet && snippet && snippet !== description && (
                    <div
                        className='text-sm text-gray-500 mb-3 italic'
                        dangerouslySetInnerHTML={{
                            __html: highlightText(snippet, highlightQuery),
                        }}
                    />
                )}

                <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-500'>{date}</span>
                    <div className='flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm'>
                        <FileText className='h-4 w-4 mr-1' />
                        記事を読む
                    </div>
                </div>
            </Link>

            {/* Tags */}
            {tags.length > 0 && (
                <div className='px-6 pb-4'>
                    <div className='flex flex-wrap gap-2'>
                        {tags.map(tag => (
                            <Link
                                key={tag}
                                href={`/tag/${encodeURIComponent(tag)}`}
                                className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200 transition-colors'
                                onClick={e => e.stopPropagation()}
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ArticleCard
