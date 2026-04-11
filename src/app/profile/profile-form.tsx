'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useActionState, useCallback, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Cropper, { type Area, type MediaSize } from 'react-easy-crop'
import { updateProfile } from '@/lib/actions/profile'
import { AVATAR_IMAGE_COMPRESSION_RULE, compress_image_file } from '@/lib/image-compression'

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
const AVATAR_CROP_ASPECT = 1
const AVATAR_CROP_SIZE = 320
const DEFAULT_MAX_AVATAR_ZOOM = 3
const AVATAR_CROP_FRAME_SHORT_SIDE = AVATAR_CROP_SIZE

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

const get_cropped_avatar_file = async (img_src: string, cropped_area_pixels: Area) => {
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
    return new File([blob], 'avatar-cropped.webp', { type: 'image/webp' })
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

const extract_avatar_path = (avatar_url: string | null) => {
    if (!avatar_url) return ''

    try {
        const url = new URL(avatar_url)
        const [, path = ''] = url.pathname.split('/storage/v1/object/public/Users/')
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

const ProfileForm = ({ displayName, accountId, avatarUrl }: ProfileFormProps) => {
    const [state, formAction] = useActionState(updateProfile, initial_state)
    const router = useRouter()
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl ?? '')
    const [currentAvatarPath, setCurrentAvatarPath] = useState(extract_avatar_path(avatarUrl))
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [crop_src, setCropSrc] = useState('')
    const [is_cropper_open, setIsCropperOpen] = useState(false)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [min_zoom, setMinZoom] = useState(1)
    const [max_zoom, setMaxZoom] = useState(DEFAULT_MAX_AVATAR_ZOOM)
    const [cropped_area_pixels, setCroppedAreaPixels] = useState<Area>()

    useEffect(() => {
        if (!state?.success) {
            return
        }

        window.dispatchEvent(new CustomEvent('profile-updated'))
        router.refresh()
    }, [router, state?.success])

    const reset_crop_state = useCallback(() => {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setMinZoom(1)
        setMaxZoom(DEFAULT_MAX_AVATAR_ZOOM)
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
            setMaxZoom(DEFAULT_MAX_AVATAR_ZOOM)
            return
        }

        const short_side = Math.min(width, height)
        const next_max_zoom = Math.max(
            1,
            short_side / AVATAR_CROP_FRAME_SHORT_SIDE,
            DEFAULT_MAX_AVATAR_ZOOM,
        )

        setMinZoom(1)
        setZoom(1)
        setMaxZoom(next_max_zoom)
    }, [])

    const on_crop_complete = useCallback((_: Area, next_cropped_area_pixels: Area) => {
        setCroppedAreaPixels(next_cropped_area_pixels)
    }, [])

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    const upload_cropped_avatar = async () => {
        if (!crop_src || !cropped_area_pixels) {
            return
        }

        setUploading(true)
        setUploadError(null)

        try {
            const cropped_file = await get_cropped_avatar_file(crop_src, cropped_area_pixels)
            const compressed_file = await compress_image_file(
                cropped_file,
                AVATAR_IMAGE_COMPRESSION_RULE,
            )

            const upload_form_data = new FormData()
            upload_form_data.append('file', compressed_file)
            upload_form_data.append('currentPath', currentAvatarPath)
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
            const uploaded_path = String(payload?.path ?? '')
            if (!public_url) {
                throw new Error('画像URLの取得に失敗しました')
            }
            if (!uploaded_path) {
                throw new Error('画像パスの取得に失敗しました')
            }

            setCurrentAvatarUrl(public_url)
            setCurrentAvatarPath(uploaded_path)
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
                        disabled={uploading || is_cropper_open}
                        className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm'
                    />
                </div>
                <input type='hidden' name='avatar_url' value={currentAvatarUrl} />
                {uploading ? <p className='text-xs text-gray-500'>アップロード中...</p> : null}
                {uploadError ? <p className='text-xs text-red-600'>{uploadError}</p> : null}
            </div>

            {is_cropper_open && (
                <div className='fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4'>
                    <div className='w-full max-w-lg rounded-xl bg-white p-4 shadow-xl'>
                        <p className='text-sm font-semibold text-gray-800'>アイコンを調整</p>
                        <p className='mt-1 text-xs text-gray-500'>
                            ドラッグで位置、スライダーで拡大
                        </p>

                        <div className='relative mt-3 h-80 w-full overflow-hidden rounded-lg bg-gray-900'>
                            <Cropper
                                image={crop_src}
                                crop={crop}
                                zoom={zoom}
                                aspect={AVATAR_CROP_ASPECT}
                                minZoom={min_zoom}
                                maxZoom={max_zoom}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={on_crop_complete}
                                onMediaLoaded={on_media_loaded}
                                showGrid={false}
                            />
                        </div>

                        <div className='mt-4'>
                            <label
                                htmlFor='avatar-zoom'
                                className='text-xs font-medium text-gray-600'
                            >
                                ズーム
                            </label>
                            <input
                                id='avatar-zoom'
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
                                onClick={upload_cropped_avatar}
                                disabled={uploading || !cropped_area_pixels}
                                className='rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'
                            >
                                {uploading ? 'アップロード中...' : '切り抜いて適用'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
