import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ActionError = { error: string }

type AuthResult = { userId: string }

type AccountResult = { accountId: string }

export const isActionError = (value: unknown): value is ActionError => {
    return !!value && typeof value === 'object' && 'error' in value
}

export const getAuthenticatedUserId = async (): Promise<AuthResult | ActionError> => {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user) {
        return { error: 'ログインが必要です' }
    }

    return { userId: data.user.id }
}

export const requireAuthenticatedUserId = async (
    login_path = '/auth/login',
): Promise<AuthResult> => {
    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        redirect(login_path)
    }

    return auth
}

export const requireAdminUserId = async (
    login_path = '/auth/login',
    forbidden_path = '/',
): Promise<AuthResult> => {
    const auth = await requireAuthenticatedUserId(login_path)

    const supabase = await createClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', auth.userId)
        .single()

    if (!profile || profile.role !== 'admin') {
        redirect(forbidden_path)
    }

    return auth
}

export const getCurrentUserAccountId = async (): Promise<AccountResult | ActionError> => {
    const auth = await getAuthenticatedUserId()
    if (isActionError(auth)) {
        return auth
    }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('id', auth.userId)
        .single()

    if (error || !data) {
        return { error: 'プロフィールが見つかりません' }
    }

    return { accountId: data.account_id }
}
