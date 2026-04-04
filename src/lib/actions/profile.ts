'use server'

import { redirect } from 'next/navigation'
import { getAuthenticatedUserId, isActionError } from '@/lib/actions/action-context'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type ActionState = {
    error?: string
    success?: boolean
}

const account_id_regex = /^[a-z0-9_-]{4,14}$/

const is_numeric_only = (value: string) => /^\d+$/.test(value)

export async function updateProfile(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const display_name = String(formData.get('display_name') ?? '').trim()
    const account_id_raw = String(formData.get('account_id') ?? '')
        .trim()
        .toLowerCase()

    if (!display_name) {
        return { error: '表示名を入力してください' }
    }

    if (!account_id_regex.test(account_id_raw) || is_numeric_only(account_id_raw)) {
        return { error: 'アカウントIDは4-14文字の英数字と_-で、数字のみは不可です' }
    }

    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        return auth
    }

    const supabase = await createClient()
    const { error } = await supabase
        .from('profiles')
        .update({ display_name, account_id: account_id_raw })
        .eq('id', auth.userId)

    if (error) {
        return { error: error.message ?? '更新に失敗しました' }
    }

    return { success: true }
}

export async function deleteAccount(
    _prevState: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const confirmation = String(formData.get('confirmation') ?? '').trim()

    if (confirmation !== 'delete') {
        return { error: '確認のため delete と入力してください' }
    }

    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        return auth
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(auth.userId)

    if (error) {
        return { error: error.message ?? 'アカウント削除に失敗しました' }
    }

    redirect('/auth/login')
}
