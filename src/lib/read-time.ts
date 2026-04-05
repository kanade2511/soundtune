export const set_read_time = (content: string): number => {
    const length = content.replace(/\s+/g, '').length
    return Math.max(1, Math.ceil(length / 500))
}

export const format_read_time = (readTime: number | null | undefined): string => {
    const minutes = readTime && readTime > 0 ? readTime : 1
    return `${minutes}分`
}
