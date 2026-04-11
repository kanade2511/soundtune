'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useCallback, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createPost } from '@/lib/actions/posts'
import { compress_image_file } from '@/lib/image-compression'

type CreatePostState = {
    error?: string
}

type NewPostFormProps = {
    articleId: string
}

const initial_state: CreatePostState = {}
const STORAGE_UPLOAD_TIMEOUT_MS = 120000

const dedupe_paths = (paths: string[]) => {
    return Array.from(new Set(paths.filter(Boolean)))
}

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
            {uploading ? 'アップロード中...' : pending ? '投稿中...' : '投稿する'}
        </button>
    )
}

const NewPostForm = ({ articleId }: NewPostFormProps) => {
    const [state, formAction] = useActionState(createPost, initial_state)
    const router = useRouter()
    const [thumbnailUrl, setThumbnailUrl] = useState('')
    const [currentThumbnailPath, setCurrentThumbnailPath] = useState('')
    const [sessionUploadedPaths, setSessionUploadedPaths] = useState<string[]>([])
    const [cleanupThumbnailPaths, setCleanupThumbnailPaths] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (state?.error) {
            setIsSubmitting(false)
        }
    }, [state?.error])

    const request_cleanup = useCallback(
        (paths: string[]) => {
            const targets = dedupe_paths(paths)
            if (targets.length === 0) return

            const payload = JSON.stringify({ articleId, paths: targets })

            if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                const blob = new Blob([payload], { type: 'application/json' })
                navigator.sendBeacon('/api/thumbnails/cleanup', blob)
                return
            }

            void fetch('/api/thumbnails/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true,
            })
        },
        [articleId],
    )

    useEffect(() => {
        const handle_beforeunload = () => {
            if (isSubmitting) return
            request_cleanup(sessionUploadedPaths)
        }

        window.addEventListener('beforeunload', handle_beforeunload)
        return () => window.removeEventListener('beforeunload', handle_beforeunload)
    }, [isSubmitting, request_cleanup, sessionUploadedPaths])

    const handleThumbnailChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }

        setUploading(true)
        setUploadError(null)

        try {
            const compressed_file = await compress_image_file(file)

            const upload_form_data = new FormData()
            upload_form_data.append('articleId', articleId)
            upload_form_data.append('file', compressed_file)

            const response = await with_timeout(
                fetch('/api/storage/upload-thumbnail', {
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
            const uploaded_path = String(payload?.path ?? '')
            if (!public_url) {
                throw new Error('画像URLの取得に失敗しました')
            }
            if (!uploaded_path) {
                throw new Error('画像パスの取得に失敗しました')
            }

            if (currentThumbnailPath && currentThumbnailPath !== uploaded_path) {
                setCleanupThumbnailPaths(prev => dedupe_paths([...prev, currentThumbnailPath]))
            }

            setThumbnailUrl(public_url)
            setCurrentThumbnailPath(uploaded_path)
            setSessionUploadedPaths(prev => dedupe_paths([...prev, uploaded_path]))
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
                    return
                }
                setIsSubmitting(true)
            }}
            className='space-y-6'
        >
            <input type='hidden' name='articleId' value={articleId} />
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
                    type='file'
                    accept='image/*'
                    onChange={handleThumbnailChange}
                    disabled={uploading}
                    className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                />
                <input type='hidden' name='thumbnailUrl' value={thumbnailUrl} />
                <input
                    type='hidden'
                    name='cleanupThumbnailPaths'
                    value={JSON.stringify(cleanupThumbnailPaths)}
                />
                {uploading ? <p className='text-xs text-gray-500'>アップロード中...</p> : null}
                {thumbnailUrl ? (
                    <p className='text-xs text-gray-500'>画像をアップロードしました</p>
                ) : null}
                {uploadError ? <p className='text-xs text-red-600'>{uploadError}</p> : null}
            </div>

            {state?.error ? <p className='text-sm text-red-600'>{state.error}</p> : null}

            <div className='flex items-center gap-3'>
                <SubmitButton uploading={uploading} />
                <button
                    type='button'
                    onClick={() => {
                        request_cleanup(sessionUploadedPaths)
                        router.push('/')
                    }}
                    className='rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50'
                >
                    キャンセル
                </button>
            </div>
        </form>
    )
}

export default NewPostForm
