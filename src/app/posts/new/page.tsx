import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewPostForm from './new-post-form'

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

    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-2xl font-bold text-gray-800'>新規投稿</h1>
                <p className='mt-2 text-sm text-gray-600'>タイトルと本文を入力してください。</p>
            </div>
            <NewPostForm />
        </div>
    )
}

export default NewPostPage
