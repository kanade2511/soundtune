'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAuthenticatedUserId, isActionError } from '@/lib/actions/action-context'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type ActionState = {
    error?: string
    role?: 'member' | 'admin'
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

    return auth.userId
}

export async function updateUserRole(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    await ensure_admin()

    const targetUserId = String(formData.get('userId') ?? '').trim()
    const role = String(formData.get('role') ?? '').trim()

    if (!targetUserId) {
        return { error: '対象ユーザーが不正です' }
    }

    if (role !== 'member' && role !== 'admin') {
        return { error: '権限が不正です' }
    }

    const client = await createClient()
    const { error } = await client.rpc('set_user_role', {
        target_user_id: targetUserId,
        new_role: role,
    })

    if (error) {
        return { error: error.message ?? '権限更新に失敗しました' }
    }

    revalidatePath('/admin/control_console')
    return { role }
}

export async function deleteUser(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    await ensure_admin()

    const targetUserId = String(formData.get('userId') ?? '').trim()

    if (!targetUserId) {
        return { error: '対象ユーザーが不正です' }
    }

    const admin = createAdminClient()
    const { data: targetProfile, error: targetError } = await admin
        .from('profiles')
        .select('role')
        .eq('id', targetUserId)
        .single()

    if (targetError || !targetProfile) {
        return { error: targetError?.message ?? '対象ユーザーが見つかりません' }
    }

    if (targetProfile.role === 'admin') {
        const { count } = await admin
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'admin')

        if (count !== null && count <= 1) {
            return { error: '最後のadminは削除できません' }
        }
    }

    const { error } = await admin.auth.admin.deleteUser(targetUserId)
    if (error) {
        return { error: error.message ?? 'ユーザー削除に失敗しました' }
    }

    revalidatePath('/admin/control_console')
    return {}
}
