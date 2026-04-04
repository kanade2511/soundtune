'use client'

import { useActionState, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createPost } from '@/lib/actions/posts'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

type CreatePostState = {
    error?: string
}

const initial_state: CreatePostState = {}

const SubmitButton = () => {
    const { pending } = useFormStatus()
    return (
        <button
            type='submit'
            className='rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={pending}
        >
            {pending ? '投稿中...' : '投稿する'}
        </button>
    )
}

const NewPostForm = () => {
    const [state, formAction] = useActionState(createPost, initial_state)
    const [thumbnailUrl, setThumbnailUrl] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const supabase = useMemo(() => createSupabaseBrowserClient(), [])

    const handleThumbnailChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            setThumbnailUrl('')
            return
        }

        setUploading(true)
        setUploadError(null)

        const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
        const fileId =
            globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`.replace('.', '')
        const filePath = `thumbnails/${fileId}.${extension}`

        const { error } = await supabase.storage
            .from('thumbnails')
            .upload(filePath, file, { upsert: true, contentType: file.type })

        if (error) {
            setUploadError(error.message)
            setUploading(false)
            return
        }

        const { data } = supabase.storage.from('thumbnails').getPublicUrl(filePath)
        setThumbnailUrl(data.publicUrl)
        setUploading(false)
    }

    return (
        <form action={formAction} className='space-y-6'>
            <div className='space-y-2'>
                <label htmlFor='title' className='text-sm font-semibold text-gray-700'>
                    タイトル
                </label>
                <input
                    id='title'
                    name='title'
                    type='text'
                    placeholder='記事のタイトルを入力'
                    className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                    required
                />
            </div>

            <div className='space-y-2'>
                <label htmlFor='content' className='text-sm font-semibold text-gray-700'>
                    本文
                </label>
                <textarea
                    id='content'
                    name='content'
                    rows={16}
                    placeholder='記事の内容を入力'
                    className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                    required
                />
            </div>

            <div className='space-y-2'>
                <label htmlFor='thumbnail' className='text-sm font-semibold text-gray-700'>
                    サムネイル画像
                </label>
                <input
                    id='thumbnail'
                    name='thumbnail'
                    type='file'
                    accept='image/*'
                    onChange={handleThumbnailChange}
                    className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                />
                <input type='hidden' name='thumbnailUrl' value={thumbnailUrl} />
                {uploading ? <p className='text-xs text-gray-500'>アップロード中...</p> : null}
                {thumbnailUrl ? (
                    <p className='text-xs text-gray-500'>アップロード済み: {thumbnailUrl}</p>
                ) : null}
                {uploadError ? <p className='text-xs text-red-600'>{uploadError}</p> : null}
                <p className='text-xs text-gray-500'>保存先: Supabase Storage (thumbnails)</p>
            </div>

            {state?.error ? <p className='text-sm text-red-600'>{state.error}</p> : null}

            <div className='flex items-center gap-3'>
                <SubmitButton />
                <a
                    href='/'
                    className='rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50'
                >
                    キャンセル
                </a>
            </div>
        </form>
    )
}

export default NewPostForm
