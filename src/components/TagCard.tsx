'use client'

import { Tag } from 'lucide-react'
import Link from 'next/link'

interface TagCardProps {
    tag: string
    articleCount: number
}

const TagCard = ({ tag, articleCount }: TagCardProps) => {
    return (
        <Link
            href={`/tag/${encodeURIComponent(tag)}`}
            className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block group'
        >
            <div className='flex items-center justify-between mb-3'>
                <Tag className='h-6 w-6 text-blue-600' />
                <span className='text-sm text-gray-500'>{articleCount}件の記事</span>
            </div>

            <h3 className='text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors'>
                #{tag}
            </h3>

            <p className='text-gray-600 text-sm'>「{tag}」に関する記事を見る</p>
        </Link>
    )
}

export default TagCard
