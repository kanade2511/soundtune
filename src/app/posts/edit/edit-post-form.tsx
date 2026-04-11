'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useCallback, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Cropper, { type Area, type MediaSize } from 'react-easy-crop'
import { deletePost, updatePost } from '@/lib/actions/posts'
import { compress_image_file, POST_IMAGE_COMPRESSION_RULE } from '@/lib/image-compression'

type ActionState = {
    error?: string
}

type EditPostFormProps = {
    postId: string
    initialTitle: string
    initialContent: string
    initialThumbnailUrl: string | null
}

const initial_state: ActionState = {}
const STORAGE_UPLOAD_TIMEOUT_MS = 120000
const THUMBNAIL_CROP_ASPECT = 16 / 9
const THUMBNAIL_CROP_FRAME_SHORT_SIDE = 320
const DEFAULT_MAX_THUMBNAIL_ZOOM = 3

const create_image = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const image = new window.Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
        image.src = src
    })
}

const to_blob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (!blob) {
                    reject(new Error('画像の切り抜きに失敗しました'))
                    return
                }

                resolve(blob)
            },
            type,
            quality,
        )
    })
}

const get_cropped_thumbnail_file = async (img_src: string, cropped_area_pixels: Area) => {
    const image = await create_image(img_src)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(cropped_area_pixels.width))
    canvas.height = Math.max(1, Math.round(cropped_area_pixels.height))

    const context = canvas.getContext('2d')
    if (!context) {
        throw new Error('画像の切り抜きに失敗しました')
    }

    context.drawImage(
        image,
        Math.round(cropped_area_pixels.x),
        Math.round(cropped_area_pixels.y),
        Math.round(cropped_area_pixels.width),
        Math.round(cropped_area_pixels.height),
        0,
        0,
        canvas.width,
        canvas.height,
    )

    const blob = await to_blob(canvas, 'image/webp', 0.92)
    return new File([blob], 'thumbnail-cropped.webp', { type: 'image/webp' })
}

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

const extract_thumbnail_path = (thumbnail_url: string | null) => {
    if (!thumbnail_url) return ''

    try {
        const url = new URL(thumbnail_url)
        const [, path = ''] = url.pathname.split('/storage/v1/object/public/Articles/')
        if (!path) return ''
        return decodeURIComponent(path)
    } catch {
        return ''
    }
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

const EditPostForm = ({
    postId,
    initialTitle,
    initialContent,
    initialThumbnailUrl,
}: EditPostFormProps) => {
    const [state, formAction] = useActionState(updatePost, initial_state)
    const [deleteState, deleteAction] = useActionState(deletePost, initial_state)
    const router = useRouter()
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState(initialThumbnailUrl ?? '')
    const [currentThumbnailPath, setCurrentThumbnailPath] = useState(
        extract_thumbnail_path(initialThumbnailUrl),
    )
    const [sessionUploadedPaths, setSessionUploadedPaths] = useState<string[]>([])
    const [cleanupThumbnailPaths, setCleanupThumbnailPaths] = useState<string[]>([])
    const [crop_src, setCropSrc] = useState('')
    const [is_cropper_open, setIsCropperOpen] = useState(false)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [min_zoom, setMinZoom] = useState(1)
    const [max_zoom, setMaxZoom] = useState(DEFAULT_MAX_THUMBNAIL_ZOOM)
    const [cropped_area_pixels, setCroppedAreaPixels] = useState<Area>()

    useEffect(() => {
        if (state?.error) {
            setIsSubmitting(false)
        }
    }, [state?.error])

    const reset_crop_state = useCallback(() => {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setMinZoom(1)
        setMaxZoom(DEFAULT_MAX_THUMBNAIL_ZOOM)
        setCroppedAreaPixels(undefined)
    }, [])

    const close_cropper = useCallback(() => {
        setIsCropperOpen(false)
        setCropSrc('')
        reset_crop_state()
    }, [reset_crop_state])

    const on_media_loaded = useCallback((media_size: MediaSize) => {
        const { width, height } = media_size
        if (!width || !height) {
            setMinZoom(1)
            setZoom(1)
            setMaxZoom(DEFAULT_MAX_THUMBNAIL_ZOOM)
            return
        }

        const short_side = Math.min(width, height)
        const next_max_zoom = Math.max(
            1,
            short_side / THUMBNAIL_CROP_FRAME_SHORT_SIDE,
            DEFAULT_MAX_THUMBNAIL_ZOOM,
        )
        setMinZoom(1)
        setZoom(1)
        setMaxZoom(next_max_zoom)
    }, [])

    const on_crop_complete = useCallback((_: Area, next_cropped_area_pixels: Area) => {
        setCroppedAreaPixels(next_cropped_area_pixels)
    }, [])

    const request_cleanup = useCallback(
        (paths: string[]) => {
            const targets = dedupe_paths(paths)
            if (targets.length === 0) return

            const payload = JSON.stringify({ postId, paths: targets })

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
        [postId],
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

        const reader = new FileReader()
        reader.addEventListener('load', () => {
            const result = reader.result?.toString() ?? ''
            if (!result) {
                setUploadError('画像の読み込みに失敗しました')
                return
            }

            setUploadError(null)
            setCropSrc(result)
            setIsCropperOpen(true)
            reset_crop_state()
        })
        reader.readAsDataURL(file)

        event.target.value = ''
    }

    const upload_cropped_thumbnail = async () => {
        if (!crop_src || !cropped_area_pixels) {
            return
        }

        setUploading(true)
        setUploadError(null)

        try {
            const cropped_file = await get_cropped_thumbnail_file(crop_src, cropped_area_pixels)
            const compressed_file = await compress_image_file(
                cropped_file,
                POST_IMAGE_COMPRESSION_RULE,
            )

            const upload_form_data = new FormData()
            upload_form_data.append('postId', postId)
            upload_form_data.append('currentPath', currentThumbnailPath)
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

            setCurrentThumbnailUrl(public_url)
            setCurrentThumbnailPath(uploaded_path)
            setSessionUploadedPaths(prev => dedupe_paths([...prev, uploaded_path]))
            close_cropper()
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
        <div className='space-y-6'>
            <form
                action={formAction}
                onSubmit={event => {
                    if (uploading || is_cropper_open) {
                        event.preventDefault()
                        return
                    }
                    setIsSubmitting(true)
                }}
                className='space-y-6'
            >
                <input type='hidden' name='postId' value={postId} />
                <input type='hidden' name='thumbnailUrl' value={currentThumbnailUrl} />
                <input
                    type='hidden'
                    name='cleanupThumbnailPaths'
                    value={JSON.stringify(cleanupThumbnailPaths)}
                />
                <div className='space-y-2'>
                    <label htmlFor='title' className='text-sm font-semibold text-gray-700'>
                        タイトル
                    </label>
                    <input
                        id='title'
                        name='title'
                        type='text'
                        defaultValue={initialTitle}
                        placeholder='投稿のタイトルを入力'
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
                        placeholder='投稿の内容を入力'
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
                        disabled={uploading || is_cropper_open}
                        className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                    />
                    {uploading ? <p className='text-xs text-gray-500'>アップロード中...</p> : null}
                    {uploadError ? <p className='text-xs text-red-600'>{uploadError}</p> : null}
                    {currentThumbnailUrl ? (
                        <p className='text-xs text-gray-500'>画像をアップロードしました</p>
                    ) : null}
                </div>

                {is_cropper_open && (
                    <div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4'>
                        <div className='w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl'>
                            <p className='text-sm font-semibold text-gray-800'>サムネイルを調整</p>
                            <p className='mt-1 text-xs text-gray-500'>
                                ドラッグで位置、スライダーで拡大（16:9）
                            </p>

                            <div className='relative mt-3 h-[320px] w-full overflow-hidden rounded-lg bg-gray-900'>
                                <Cropper
                                    image={crop_src}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={THUMBNAIL_CROP_ASPECT}
                                    minZoom={min_zoom}
                                    maxZoom={max_zoom}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={on_crop_complete}
                                    onMediaLoaded={on_media_loaded}
                                    showGrid={true}
                                />
                            </div>

                            <div className='mt-4'>
                                <label
                                    htmlFor='thumbnail-zoom-edit'
                                    className='text-xs font-medium text-gray-600'
                                >
                                    ズーム
                                </label>
                                <input
                                    id='thumbnail-zoom-edit'
                                    type='range'
                                    min={min_zoom}
                                    max={max_zoom}
                                    step={0.01}
                                    value={zoom}
                                    onChange={event => setZoom(Number(event.target.value))}
                                    className='mt-1 w-full'
                                />
                            </div>

                            <div className='mt-4 flex justify-end gap-2'>
                                <button
                                    type='button'
                                    onClick={close_cropper}
                                    disabled={uploading}
                                    className='rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60'
                                >
                                    キャンセル
                                </button>
                                <button
                                    type='button'
                                    onClick={upload_cropped_thumbnail}
                                    disabled={uploading || !cropped_area_pixels}
                                    className='rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'
                                >
                                    {uploading ? 'アップロード中...' : '切り抜いて適用'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {state?.error ? <p className='text-sm text-red-600'>{state.error}</p> : null}

                <div className='flex flex-wrap items-center gap-3'>
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

            <form action={deleteAction}>
                <input type='hidden' name='postId' value={postId} />
                {deleteState?.error ? (
                    <p className='mb-2 text-sm text-red-600'>{deleteState.error}</p>
                ) : null}
                <DeleteButton />
            </form>
        </div>
    )
}

export default EditPostForm
