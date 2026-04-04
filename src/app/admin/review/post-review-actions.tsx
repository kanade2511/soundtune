import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAuthenticatedUserId, isActionError } from '@/lib/actions/action-context'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type ReviewActionsProps = {
    articleId: string
}

const ensure_admin = async () => {
    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        redirect('/auth/login')
    }

    const authClient = await createClient()
    const { data: profile } = await authClient
        .from('profiles')
        .select('role')
        .eq('id', auth.userId)
        .single()

    if (!profile || profile.role !== 'admin') {
        redirect('/')
    }
}

const approvePost = async (formData: FormData) => {
    'use server'

    await ensure_admin()
    const articleId = String(formData.get('articleId') ?? '')

    if (!articleId) {
        return
    }

    const admin = createAdminClient()
    await admin
        .from('posts')
        .update({ approval_status: 'approved', published: true })
        .eq('article_id', articleId)

    revalidatePath('/admin/review')
}

const rejectPost = async (formData: FormData) => {
    'use server'

    await ensure_admin()
    const articleId = String(formData.get('articleId') ?? '')

    if (!articleId) {
        return
    }

    const admin = createAdminClient()
    await admin
        .from('posts')
        .update({ approval_status: 'rejected', published: false })
        .eq('article_id', articleId)

    revalidatePath('/admin/review')
}

const PostReviewActions = ({ articleId }: ReviewActionsProps) => {
    return (
        <div className='flex flex-wrap items-center gap-2'>
            <form action={approvePost}>
                <input type='hidden' name='articleId' value={articleId} />
                <button
                    type='submit'
                    className='rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700'
                >
                    承認
                </button>
            </form>
            <form action={rejectPost}>
                <input type='hidden' name='articleId' value={articleId} />
                <button
                    type='submit'
                    className='rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50'
                >
                    却下
                </button>
            </form>
        </div>
    )
}

export default PostReviewActions
