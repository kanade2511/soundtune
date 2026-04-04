import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import Breadcrumb from '@/components/Breadcrumb'
import { createAdminClient } from '@/lib/supabase/server'
import './article.css'

interface PageProps {
    params: Promise<{ account_id: string; article_id: string }>
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
    const { account_id, article_id } = await params
    const supabase = createAdminClient()

    const { data: post } = await supabase
        .from('posts')
        .select('title, content, created_at, profiles!author_id (account_id)')
        .eq('article_id', article_id)
        .single()

    const profile = Array.isArray(post?.profiles) ? post?.profiles[0] : post?.profiles

    if (!post || profile?.account_id !== account_id) {
        return { title: '記事が見つかりません - SoundTune' }
    }

    return {
        title: `${post.title} - SoundTune`,
    }
}

const ArticlePage = async ({ params }: PageProps) => {
    const { account_id, article_id } = await params
    const supabase = createAdminClient()

    const { data: post } = await supabase
        .from('posts')
        .select(
            'article_id, title, content, created_at, thumbnail_url, approval_status, profiles!author_id (display_name, account_id)',
        )
        .eq('article_id', article_id)
        .single()

    const profile = Array.isArray(post?.profiles) ? post?.profiles[0] : post?.profiles

    if (!post || profile?.account_id !== account_id) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                記事が見つかりません
            </div>
        )
    }

    return (
        <div className='min-h-screen'>
            <article className='container mx-auto px-4 py-8 max-w-4xl'>
                <Breadcrumb
                    items={[
                        { label: profile?.display_name ?? 'user', href: `/${account_id}` },
                        { label: post.title },
                    ]}
                />

                <div className='mb-8'>
                    <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight'>
                        {post.title}
                    </h1>

                    {post.thumbnail_url && (
                        <div className='relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50'>
                            <Image
                                src={post.thumbnail_url}
                                alt={post.title}
                                fill
                                className='object-cover'
                                sizes='(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 768px'
                            />
                        </div>
                    )}

                    <div className='flex items-center space-x-6 text-sm text-gray-500 border-b border-gray-200 pb-6'>
                        <div className='flex items-center space-x-2'>
                            <Calendar className='h-4 w-4' />
                            <span>{new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Clock className='h-4 w-4' />
                            <span>5分で読めます</span>
                        </div>
                    </div>
                </div>

                <div className='blog-content prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-pre:bg-gray-50 prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-600'>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {post.content}
                    </ReactMarkdown>
                </div>

                <div className='mt-12 flex justify-between items-center pt-8 border-t border-gray-200'>
                    <Link
                        href='/'
                        className='inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-medium'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        <span>ノート一覧に戻る</span>
                    </Link>
                </div>
            </article>
        </div>
    )
}

export default ArticlePage
