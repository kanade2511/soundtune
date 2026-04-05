'use client'

import { useActionState, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateProfile } from '@/lib/actions/profile'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

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

const ProfileForm = ({ displayName, accountId, avatarUrl }: ProfileFormProps) => {
    const [state, formAction] = useActionState(updateProfile, initial_state)
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl ?? '')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const supabase = useMemo(() => createSupabaseBrowserClient(), [])

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }

        setUploading(true)
        setUploadError(null)

        const { data, error: userError } = await supabase.auth.getUser()
        if (userError || !data.user) {
            setUploadError('ログインが必要です')
            setUploading(false)
            return
        }

        // 旧アバター画像がavatarsバケットのものであれば削除
        if (currentAvatarUrl && currentAvatarUrl.includes('/storage/v1/object/public/avatars/')) {
            try {
                // パス部分だけ抽出
                const url = new URL(currentAvatarUrl)
                const pathParts = url.pathname.split('/avatars/')
                if (pathParts.length === 2) {
                    const oldFilePath = decodeURIComponent(pathParts[1])
                    await supabase.storage.from('avatars').remove([oldFilePath])
                }
            } catch (e) {
                // 削除失敗は致命的でないので無視
            }
        }

        const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
        const fileId =
            globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`.replace('.', '')
        const filePath = `${data.user.id}/${fileId}.${extension}`

        const { error } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true, contentType: file.type })

        if (error) {
            setUploadError(error.message)
            setUploading(false)
            return
        }

        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        setCurrentAvatarUrl(publicData.publicUrl)
        setUploading(false)
    }

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
                <label htmlFor='avatar' className='text-sm font-semibold text-gray-700'>
                    アイコン
                </label>
                <div className='flex items-center gap-4'>
                    {currentAvatarUrl ? (
                        <img
                            src={currentAvatarUrl}
                            alt='avatar'
                            className='h-14 w-14 rounded-full object-cover'
                        />
                    ) : (
                        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600'>
                            {displayName.slice(0, 1) || 'U'}
                        </div>
                    )}
                    <input
                        id='avatar'
                        name='avatar'
                        type='file'
                        accept='image/*'
                        onChange={handleAvatarChange}
                        className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                    />
                </div>
                <input type='hidden' name='avatar_url' value={currentAvatarUrl} />
                {uploading ? <p className='text-xs text-gray-500'>アップロード中...</p> : null}
                {uploadError ? <p className='text-xs text-red-600'>{uploadError}</p> : null}
                <p className='text-xs text-gray-500'>保存先: Supabase Storage (avatars)</p>
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
