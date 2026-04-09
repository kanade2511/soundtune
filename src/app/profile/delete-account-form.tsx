'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteAccount } from '@/lib/actions/profile'

type ActionState = {
    error?: string
}

type DeleteAccountFormProps = {
    accountId: string
}

const initial_state: ActionState = {}

const DeleteButton = () => {
    const { pending } = useFormStatus()
    return (
        <button
            type='submit'
            className='rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={pending}
        >
            {pending ? '削除中...' : 'アカウント削除'}
        </button>
    )
}

const DeleteAccountForm = ({ accountId }: DeleteAccountFormProps) => {
    const [state, formAction] = useActionState(deleteAccount, initial_state)

    return (
        <form
            action={formAction}
            className='space-y-4 rounded-lg border border-red-200 bg-red-50 p-6'
        >
            <div className='space-y-2'>
                <h2 className='text-sm font-semibold text-red-700'>アカウント削除</h2>
                <p className='text-xs text-red-600'>
                    削除すると投稿も含めて復元できません。確認のため {accountId}{' '}
                    と入力してください。
                </p>
                <input
                    name='confirmation'
                    type='text'
                    placeholder={accountId}
                    className='w-full rounded-md border border-red-200 px-3 py-2 text-sm shadow-sm'
                />
            </div>

            {state?.error ? <p className='text-sm text-red-700'>{state.error}</p> : null}

            <DeleteButton />
        </form>
    )
}

export default DeleteAccountForm
