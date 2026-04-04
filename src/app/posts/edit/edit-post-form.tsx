'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { deletePost, updatePost } from '@/lib/actions/posts'

type ActionState = {
    error?: string
}

type EditPostFormProps = {
    articleId: string
    initialTitle: string
    initialContent: string
}

const initial_state: ActionState = {}

const SubmitButton = () => {
    const { pending } = useFormStatus()
    return (
        <button
            type='submit'
            className='rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={pending}
        >
            {pending ? '更新中...' : '更新する'}
        </button>
    )
}

const DeleteButton = () => {
    const { pending } = useFormStatus()
    return (
        <button
            type='submit'
            className='rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={pending}
        >
            {pending ? '削除中...' : '削除する'}
        </button>
    )
}

const EditPostForm = ({ articleId, initialTitle, initialContent }: EditPostFormProps) => {
    const [state, formAction] = useActionState(updatePost, initial_state)
    const [deleteState, deleteAction] = useActionState(deletePost, initial_state)

    return (
        <div className='space-y-6'>
            <form action={formAction} className='space-y-6'>
                <input type='hidden' name='articleId' value={articleId} />
                <div className='space-y-2'>
                    <label htmlFor='title' className='text-sm font-semibold text-gray-700'>
                        タイトル
                    </label>
                    <input
                        id='title'
                        name='title'
                        type='text'
                        defaultValue={initialTitle}
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
                        defaultValue={initialContent}
                        placeholder='記事の内容を入力'
                        className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                        required
                    />
                </div>

                {state?.error ? <p className='text-sm text-red-600'>{state.error}</p> : null}

                <div className='flex flex-wrap items-center gap-3'>
                    <SubmitButton />
                    <a
                        href='/'
                        className='rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50'
                    >
                        キャンセル
                    </a>
                </div>
            </form>

            <form action={deleteAction}>
                <input type='hidden' name='articleId' value={articleId} />
                {deleteState?.error ? (
                    <p className='mb-2 text-sm text-red-600'>{deleteState.error}</p>
                ) : null}
                <DeleteButton />
            </form>
        </div>
    )
}

export default EditPostForm
