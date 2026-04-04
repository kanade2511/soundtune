export const isValidArticleId = (articleId: string) => {
    return /^[A-Za-z0-9_-]{14}$/.test(articleId)
}
