'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createPost } from '@/lib/actions/posts'

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
