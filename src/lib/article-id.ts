export const isValidArticleId = (postId: string) => {
    return /^[A-Za-z0-9_-]{14}$/.test(postId)
}
