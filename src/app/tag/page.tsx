import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { FileText, Tag } from 'lucide-react'
import Link from 'next/link'

interface TagInfo {
    slug: string
    displayName: string
    count: number
}

const getAllTags = async (): Promise<TagInfo[]> => {
    const articlesDir = path.join(process.cwd(), 'src', 'notes')
    const filenames = await fs.readdir(articlesDir)
    const markdownFiles = filenames.filter(name => name.endsWith('.md'))

    const tagCounts: Record<string, number> = {}

    for (const filename of markdownFiles) {
        const filePath = path.join(articlesDir, filename)
        const fileContent = await fs.readFile(filePath, 'utf8')
        const { data } = matter(fileContent)

        const tags = data.tags || []
        for (const tag of tags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
        }
    }

    const tagInfos: TagInfo[] = Object.entries(tagCounts).map(([slug, count]) => ({
        slug,
        displayName: slug, // 日本語タグをそのまま使用
        count,
    }))

    // 記事数順にソート
    tagInfos.sort((a, b) => b.count - a.count)

    return tagInfos
}

const TagsPage = async () => {
    const tags = await getAllTags()

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50'>
            <div className='container mx-auto px-4 py-8 max-w-4xl'>
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
                        <Link
                            key={tag.slug}
                            href={`/tag/${encodeURIComponent(tag.slug)}`}
                            className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 group'
                        >
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center space-x-2'>
                                    <Tag className='h-5 w-5 text-blue-600' />
                                    <span className='font-medium text-gray-800 group-hover:text-blue-600 transition-colors'>
                                        {tag.displayName}
                                    </span>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <span className='text-sm text-gray-500'>{tag.count}件</span>
                                    <FileText className='h-4 w-4 text-gray-400' />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Navigation */}
                <div className='pt-8 border-t border-gray-200'>
                    <Link
                        href='/'
                        className='inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-medium'
                    >
                        <FileText className='h-4 w-4' />
                        <span>ホームに戻る</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default TagsPage
