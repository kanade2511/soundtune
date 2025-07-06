import Breadcrumb from '@/components/Breadcrumb'
import TagCard from '@/components/TagCard'
import { getAllTags } from '@/lib/articles'
import { Tag } from 'lucide-react'
import Link from 'next/link'

const TagsPage = async () => {
    const tags = await getAllTags()

    return (
        <div className='min-h-screen'>
            <div className='container mx-auto px-4 py-8 max-w-4xl'>
                {/* Breadcrumb */}
                <Breadcrumb items={[{ label: 'タグ一覧' }]} />

                {/* Header */}
                <div className='mb-8'>
                    <div className='flex items-center space-x-2 mb-4'>
                        <Tag className='h-6 w-6 text-blue-600' />
                        <span className='text-sm font-medium text-blue-600'>タグ一覧</span>
                    </div>

                    <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight'>
                        全てのタグ
                    </h1>

                    <p className='text-xl text-gray-600 mb-6'>記事を分類するタグの一覧です</p>
                </div>

                {/* Tags */}
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12'>
                    {tags.map(tag => (
                        <TagCard key={tag.slug} tag={tag.displayName} articleCount={tag.count} />
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

export default TagsPage
