import { createAdminClient } from '@/lib/supabase/server'

const THUMBNAIL_BUCKET = 'Articles'
const THUMBNAIL_PUBLIC_PREFIX = '/storage/v1/object/public/Articles/'

const dedupe_paths = (paths: string[]) => {
    return Array.from(new Set(paths.filter(Boolean)))
}

const remove_thumbnail_paths = async (paths: string[]) => {
    if (paths.length === 0) return

    const admin = createAdminClient()
    const { error } = await admin.storage.from(THUMBNAIL_BUCKET).remove(paths)

    if (error) {
        console.error('thumbnail cleanup failed', error)
    }
}

const is_scoped_thumbnail_path = (path: string, post_id: string) => {
    return path.startsWith(`${post_id}/`) && !path.includes('..')
}

export const extract_thumbnail_path = (thumbnail_url: string | null) => {
    if (!thumbnail_url) return null

    try {
        const url = new URL(thumbnail_url)
        const [, path = ''] = url.pathname.split(THUMBNAIL_PUBLIC_PREFIX)
        if (!path) return null
        return decodeURIComponent(path)
    } catch {
        return null
    }
}

export const cleanup_thumbnail_on_create = async (post_id: string, candidate_paths: string[]) => {
    const targets = dedupe_paths(candidate_paths).filter(path =>
        is_scoped_thumbnail_path(path, post_id),
    )

    await remove_thumbnail_paths(targets)
}

export const cleanup_thumbnail_on_update = async (
    post_id: string,
    candidate_paths: string[],
    previous_thumbnail_url: string | null,
    next_thumbnail_url: string | null,
) => {
    const scoped_targets = dedupe_paths(candidate_paths).filter(path =>
        is_scoped_thumbnail_path(path, post_id),
    )

    const previous_path =
        previous_thumbnail_url && previous_thumbnail_url !== next_thumbnail_url
            ? extract_thumbnail_path(previous_thumbnail_url)
            : null

    const targets = dedupe_paths([...scoped_targets, ...(previous_path ? [previous_path] : [])])

    await remove_thumbnail_paths(targets)
}

export const cleanup_thumbnail_on_delete = async (
    post_id: string,
    previous_thumbnail_url: string | null,
) => {
    const admin = createAdminClient()
    const scoped_prefix = post_id

    const { data, error } = await admin.storage
        .from(THUMBNAIL_BUCKET)
        .list(scoped_prefix, { limit: 1000 })

    if (error) {
        console.error('thumbnail list failed', error)
    }

    const scoped_paths = (data ?? [])
        .filter(item => !!item.name)
        .map(item => `${scoped_prefix}/${item.name}`)

    const previous_path = extract_thumbnail_path(previous_thumbnail_url)
    const targets = dedupe_paths([...scoped_paths, ...(previous_path ? [previous_path] : [])])

    await remove_thumbnail_paths(targets)
}
