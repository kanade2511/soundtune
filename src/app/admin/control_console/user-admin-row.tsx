'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteUser, updateUserRole } from '@/lib/actions/admin'

type ActionState = {
    error?: string
    role?: 'member' | 'admin'
}

type UserAdminRowProps = {
    userId: string
    displayName: string
    accountId: string
    role: 'member' | 'admin'
    createdAt: string
    isSelf: boolean
}

const initial_state: ActionState = {}

const SubmitButton = ({ label }: { label: string }) => {
    const { pending } = useFormStatus()
    return (
        <button
            type='submit'
            className='rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={pending}
        >
            {pending ? '処理中...' : label}
        </button>
    )
}

const DeleteButton = () => {
    const { pending } = useFormStatus()
    return (
        <button
            type='submit'
            className='rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={pending}
        >
            {pending ? '削除中...' : '削除'}
        </button>
    )
}

const UserAdminRow = ({
    userId,
    displayName,
    accountId,
    role,
    createdAt,
    isSelf,
}: UserAdminRowProps) => {
    const [roleState, roleAction] = useActionState(updateUserRole, initial_state)
    const [deleteState, deleteAction] = useActionState(deleteUser, initial_state)
    const [currentRole, setCurrentRole] = useState(role)
    const [savedRole, setSavedRole] = useState(role)

    useEffect(() => {
        if (roleState?.role) {
            setCurrentRole(roleState.role)
            setSavedRole(roleState.role)
        }
        if (roleState?.error) {
            setCurrentRole(savedRole)
        }
    }, [roleState, savedRole])

    return (
        <div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
                <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                        <p className='text-base font-semibold text-gray-800'>{displayName}</p>
                        <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600'>
                            {currentRole}
                        </span>
                        {isSelf ? (
                            <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700'>
                                あなた
                            </span>
                        ) : null}
                    </div>
                    <p className='text-sm text-gray-500'>@{accountId}</p>
                    <p className='text-xs text-gray-400'>
                        作成日: {new Date(createdAt).toLocaleDateString('ja-JP')}
                    </p>
                </div>

                <div className='flex flex-wrap items-center gap-3'>
                    <form action={roleAction} className='flex flex-wrap items-center gap-2'>
                        <input type='hidden' name='userId' value={userId} />
                        <select
                            name='role'
                            value={currentRole}
                            onChange={event =>
                                setCurrentRole(event.target.value as 'member' | 'admin')
                            }
                            className='rounded-md border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700'
                        >
                            <option value='member'>member</option>
                            <option value='admin'>admin</option>
                        </select>
                        <SubmitButton label='権限更新' />
                    </form>

                    <form
                        action={deleteAction}
                        onSubmit={event => {
                            if (!window.confirm('このユーザーを削除します。よろしいですか？')) {
                                event.preventDefault()
                            }
                        }}
                    >
                        <input type='hidden' name='userId' value={userId} />
                        <DeleteButton />
                    </form>
                </div>
            </div>

            {roleState?.error ? <p className='text-xs text-red-600'>{roleState.error}</p> : null}
            {deleteState?.error ? (
                <p className='text-xs text-red-600'>{deleteState.error}</p>
            ) : null}
        </div>
    )
}

export default UserAdminRow
