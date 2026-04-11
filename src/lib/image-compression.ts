import imageCompression from 'browser-image-compression'

const MB = 1024 * 1024
const SIZE_THRESHOLD_BYTES = 3 * MB
const MAX_WIDTH = 1024

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

export const compress_image_file = async (file: File): Promise<File> => {
    if (file.size <= SIZE_THRESHOLD_BYTES) {
        return file
    }

    const width = await get_image_width(file)
    if (width <= MAX_WIDTH) {
        return file
    }

    return await imageCompression(file, {
        maxWidthOrHeight: MAX_WIDTH,
        useWebWorker: true,
    })
}
