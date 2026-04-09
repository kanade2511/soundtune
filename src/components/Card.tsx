'use client'

import { Calendar, Clock, Loader } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface CardProps {
    title: string
    description?: string
    readTime: string
    date: string
    thumbnail?: string
    href: string
}

const Card = ({ title, description, readTime, date, thumbnail, href }: CardProps) => {
    return (
        <div className='h-full w-full overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg'>
            <Link href={href} className='block'>
                {/* 画像エリア */}
                <div className='relative h-48'>
                    <div className='absolute inset-0 bg-white bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] rounded z-10'>
                        <div className='absolute bottom-3 right-3 z-5'>
                            <Loader className='h-6 w-6 text-gray-400 animate-spin' />
                        </div>
                        {thumbnail && (
                            <Image
                                src={thumbnail}
                                alt={title}
                                fill
                                className='absolute inset-0 w-full h-full object-cover z-10'
                                sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
                            />
                        )}
                        {/* カテゴリラベル削除 */}
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
            {/* タグ表示削除 */}
        </div>
    )
}

export default Card
