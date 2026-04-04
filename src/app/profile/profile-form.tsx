'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateProfile } from '@/lib/actions/profile'

type ActionState = {
    error?: string
    success?: boolean
}

type ProfileFormProps = {
    displayName: string
    accountId: string
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

const ProfileForm = ({ displayName, accountId }: ProfileFormProps) => {
    const [state, formAction] = useActionState(updateProfile, initial_state)

    return (
        <form
            action={formAction}
            className='space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm'
        >
            <div className='space-y-2'>
                <label htmlFor='display_name' className='text-sm font-semibold text-gray-700'>
                    表示名
                </label>
                <input
                    id='display_name'
                    name='display_name'
                    type='text'
                    defaultValue={displayName}
                    className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                    required
                />
            </div>

            <div className='space-y-2'>
                <label htmlFor='account_id' className='text-sm font-semibold text-gray-700'>
                    アカウントID
                </label>
                <input
                    id='account_id'
                    name='account_id'
                    type='text'
                    defaultValue={accountId}
                    className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                    required
                />
                <p className='text-xs text-gray-500'>4-14文字の英数字・_・-（数字のみ不可）</p>
            </div>

            {state?.error ? <p className='text-sm text-red-600'>{state.error}</p> : null}
            {state?.success ? <p className='text-sm text-green-600'>更新しました</p> : null}

            <SubmitButton />
        </form>
    )
}

export default ProfileForm
