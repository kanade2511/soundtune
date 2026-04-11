'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateProfile } from '@/lib/actions/profile'
import { compress_image_file } from '@/lib/image-compression'

type ActionState = {
    error?: string
    success?: boolean
}

type ProfileFormProps = {
    displayName: string
    accountId: string
    avatarUrl: string | null
}

const initial_state: ActionState = {}
const STORAGE_UPLOAD_TIMEOUT_MS = 120000

const with_timeout = async <T,>(
    promise: Promise<T>,
    timeout_ms: number,
    timeout_message: string,
) => {
    return await new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(timeout_message))
        }, timeout_ms)

        promise
            .then(value => {
                clearTimeout(timer)
                resolve(value)
            })
            .catch(error => {
                clearTimeout(timer)
                reject(error)
            })
    })
}

const SubmitButton = ({ uploading }: { uploading: boolean }) => {
    const { pending } = useFormStatus()
    return (
        <button
            type='submit'
            className='rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={pending || uploading}
        >
            {uploading ? 'アップロード中...' : pending ? '更新中...' : '更新する'}
        </button>
    )
}

const ProfileForm = ({ displayName, accountId, avatarUrl }: ProfileFormProps) => {
    const [state, formAction] = useActionState(updateProfile, initial_state)
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl ?? '')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }

        setUploading(true)
        setUploadError(null)

        try {
            const compressed_file = await compress_image_file(file)

            const upload_form_data = new FormData()
            upload_form_data.append('file', compressed_file)
            upload_form_data.append('oldAvatarUrl', currentAvatarUrl)

            const response = await with_timeout(
                fetch('/api/storage/upload-avatar', {
                    method: 'POST',
                    body: upload_form_data,
                }),
                STORAGE_UPLOAD_TIMEOUT_MS,
                '画像アップロードがタイムアウトしました',
            )

            const payload = await response.json().catch(() => null)
            if (!response.ok) {
                throw new Error(payload?.error ?? '画像アップロードに失敗しました')
            }

            const public_url = String(payload?.publicUrl ?? '')
            if (!public_url) {
                throw new Error('画像URLの取得に失敗しました')
            }

            setCurrentAvatarUrl(public_url)
        } catch (error) {
            const message =
                error instanceof Error ? error.message : '画像アップロードに失敗しました'
            setUploadError(
                message.includes('Failed to fetch')
                    ? '通信エラーで画像アップロードに失敗しました。接続状態を確認して再試行してください。'
                    : message,
            )
        } finally {
            setUploading(false)
        }
    }

    return (
        <form
            action={formAction}
            onSubmit={event => {
                if (uploading) {
                    event.preventDefault()
                }
            }}
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
                <label htmlFor='avatar' className='text-sm font-semibold text-gray-700'>
                    アイコン
                </label>
                <div className='flex items-center gap-4'>
                    {currentAvatarUrl ? (
                        <Image
                            src={currentAvatarUrl}
                            alt='avatar'
                            width={56}
                            height={56}
                            className='h-14 w-14 rounded-full object-cover'
                        />
                    ) : (
                        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600'>
                            {displayName.slice(0, 1) || 'U'}
                        </div>
                    )}
                    <input
                        id='avatar'
                        type='file'
                        accept='image/*'
                        onChange={handleAvatarChange}
                        disabled={uploading}
                        className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                    />
                </div>
                <input type='hidden' name='avatar_url' value={currentAvatarUrl} />
                {uploading ? <p className='text-xs text-gray-500'>アップロード中...</p> : null}
                {uploadError ? <p className='text-xs text-red-600'>{uploadError}</p> : null}
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

            <SubmitButton uploading={uploading} />
        </form>
    )
}

export default ProfileForm
