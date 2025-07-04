import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { ArrowLeft, Calendar, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PostMetadata {
    title: string
    category: string
    description: string
    readTime: string
    date: string
    tags: string[]
}

const getMarkdownWithMetadata = async (
    slug: string,
): Promise<{
    content: string
    metadata: PostMetadata
}> => {
    try {
        const filePath = path.join(process.cwd(), 'src', 'notes', `${slug}.md`)
        const fileContent = await fs.readFile(filePath, 'utf8')

        const { data, content } = matter(fileContent)

        return {
            content,
            metadata: {
                title: data.title || '記事タイトル',
                category: data.category || '一般',
                description: data.description || '記事の説明文',
                readTime: data.readTime || '5分',
                date: data.date || '2025-07-04',
                tags: data.tags || [],
            },
        }
    } catch (error) {
        throw new Error('記事が見つかりません')
    }
}

const Page = async ({ params }: { params: { slug: string } }) => {
    const { content, metadata } = await getMarkdownWithMetadata(params.slug)

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50'>
            {/* Article */}
            <article className='container mx-auto px-4 py-8 max-w-4xl'>
                {/* Breadcrumb */}
                <nav className='flex items-center space-x-2 text-sm text-gray-500 mb-6'>
                    <Link href='/' className='hover:text-blue-600 transition-colors'>
                        ホーム
                    </Link>
                    <ChevronRight className='h-4 w-4' />
                    <Link
                        href={`/tag/${encodeURIComponent(metadata.category)}`}
                        className='hover:text-blue-600 transition-colors'
                    >
                        {metadata.category}
                    </Link>
                    <ChevronRight className='h-4 w-4' />
                    <span className='text-gray-700 font-medium truncate'>{metadata.title}</span>
                </nav>

                {/* Article Header */}
                <div className='mb-8'>
                    <div className='flex items-center space-x-2 mb-4'>
                        <span className='inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full'>
                            {metadata.category}
                        </span>
                    </div>

                    <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight'>
                        {metadata.title}
                    </h1>

                    <p className='text-xl text-gray-600 mb-6'>{metadata.description}</p>

                    <div className='flex items-center space-x-6 text-sm text-gray-500 border-b border-gray-200 pb-6'>
                        <div className='flex items-center space-x-2'>
                            <Calendar className='h-4 w-4' />
                            <span>{metadata.date}</span>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Clock className='h-4 w-4' />
                            <span>{metadata.readTime}で読めます</span>
                        </div>
                    </div>

                    {/* Tags */}
                    {metadata.tags.length > 0 && (
                        <div className='flex flex-wrap gap-2 mt-4'>
                            {metadata.tags.map(tag => (
                                <Link
                                    key={tag}
                                    href={`/tag/${encodeURIComponent(tag)}`}
                                    className='text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors'
                                >
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Article Content */}
                <div className='bg-white rounded-2xl shadow-lg p-8 md:p-12'>
                    <div className='prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-pre:bg-gray-50 prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-600'>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    </div>
                </div>

                {/* Navigation */}
                <div className='mt-12 flex justify-between items-center pt-8 border-t border-gray-200'>
                    <Link
                        href='/'
                        className='inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-medium'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        <span>ノート一覧に戻る</span>
                    </Link>
                    <div className='text-sm text-gray-500'>
                        SoundTune - 音楽の世界をもっと身近に
                    </div>
                </div>
            </article>
        </div>
    )
}

export default Page
