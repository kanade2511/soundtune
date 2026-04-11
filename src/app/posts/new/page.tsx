import crypto from 'node:crypto'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewPostForm from './new-post-form'

const generate_post_id = () => {
    return crypto.randomBytes(14).toString('base64url').slice(0, 14)
}

const NewPostPage = async () => {
    const supabase = await createClient().catch(() => null)
    if (!supabase) {
        return (
            <div className='rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
                Supabaseの環境変数が未設定です
            </div>
        )
    }

    const { data } = await supabase.auth.getUser()
    if (!data.user) {
        redirect('/auth/login?next=/posts/new')
    }

    const post_id = generate_post_id()

    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-2xl font-bold text-gray-800'>新規投稿</h1>
                <p className='mt-2 text-sm text-gray-600'>タイトルと本文を入力してください。</p>
            </div>
            <NewPostForm postId={post_id} />
        </div>
    )
}

export default NewPostPage
