const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export const generatePostId = (length = 14) => {
    const bytes = new Uint8Array(length)
    globalThis.crypto.getRandomValues(bytes)

    let post_id = ''
    for (let i = 0; i < length; i += 1) {
        post_id += BASE64URL_ALPHABET[bytes[i] % BASE64URL_ALPHABET.length]
    }

    return post_id
}
