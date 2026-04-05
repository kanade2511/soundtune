import Link from 'next/link'
import { format_read_time } from '@/lib/read-time'
import { createAdminClient } from '@/lib/supabase/server'

interface PageProps {
    params: Promise<{ account_id: string }>
}

const AccountNotesPage = async ({ params }: PageProps) => {
    const { account_id } = await params
    const supabase = createAdminClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, account_id, avatar_url')
        .eq('account_id', account_id)
        .single()

    if (!profile) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                ユーザーが見つかりません
            </div>
        )
    }

    const { data: notes } = await supabase
        .from('posts')
        .select('article_id, title, content, created_at, read_time')
        .eq('author_id', profile.id)
        .eq('published', true)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })

    const list = notes ?? []

    return (
        <div className='min-h-screen'>
            <div className='container mx-auto px-4 py-12'>
                <div className='mb-8 space-y-2'>
                    <h1 className='text-2xl font-bold text-gray-800'>
                        {profile.display_name} のノート
                    </h1>
                    <p className='text-sm text-gray-500'>@{profile.account_id}</p>
                </div>

                {list.length === 0 ? (
                    <div className='rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600'>
                        公開中のノートはありません。
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {list.map(note => (
                            <Link
                                key={note.article_id}
                                href={`/${profile.account_id}/notes/${note.article_id}`}
                                className='block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md'
                            >
                                <div className='space-y-2'>
                                    <h2 className='text-lg font-semibold text-gray-800'>
                                        {note.title}
                                    </h2>
                                    <p className='text-sm text-gray-500 line-clamp-2'>
                                        {note.content.slice(0, 120)}
                                    </p>
                                    <div className='flex items-center gap-3 text-xs text-gray-500'>
                                        <span>
                                            {new Date(note.created_at).toLocaleDateString('ja-JP')}
                                        </span>
                                        <span>•</span>
                                        <span>{format_read_time(note.read_time)}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AccountNotesPage
