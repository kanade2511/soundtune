import imageCompression from 'browser-image-compression'

const MB = 1024 * 1024

export type CompressionRule = {
    max_size_mb: number
    max_width: number
}

export const POST_IMAGE_COMPRESSION_RULE: CompressionRule = {
    max_size_mb: 3,
    max_width: 1024,
}

export const AVATAR_IMAGE_COMPRESSION_RULE: CompressionRule = {
    max_size_mb: 3,
    max_width: 128,
}

const get_image_width = async (file: File): Promise<number> => {
    return await new Promise<number>((resolve, reject) => {
        const object_url = URL.createObjectURL(file)
        const image = new Image()

        image.onload = () => {
            const width = image.naturalWidth || image.width
            URL.revokeObjectURL(object_url)
            resolve(width)
        }

        image.onerror = () => {
            URL.revokeObjectURL(object_url)
            reject(new Error('画像サイズの取得に失敗しました'))
        }

        image.src = object_url
    })
}

export const compress_image_file = async (file: File, rule: CompressionRule): Promise<File> => {
    const size_threshold_bytes = rule.max_size_mb * MB

    if (file.size <= size_threshold_bytes) {
        return file
    }

    const width = await get_image_width(file)
    if (width <= rule.max_width) {
        return file
    }

    return await imageCompression(file, {
        maxWidthOrHeight: rule.max_width,
        useWebWorker: true,
    })
}
