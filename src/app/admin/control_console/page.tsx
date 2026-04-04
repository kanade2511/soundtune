import { redirect } from 'next/navigation'
import { getAuthenticatedUserId, isActionError } from '@/lib/actions/action-context'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import UserAdminRow from './user-admin-row'

type UserRow = {
    id: string
    display_name: string | null
    account_id: string | null
    role: 'member' | 'admin' | null
    created_at: string
}

const ControlConsolePage = async () => {
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

    const admin = createAdminClient()
    const { data: users } = await admin
        .from('profiles')
        .select('id, display_name, account_id, role, created_at')
        .order('created_at', { ascending: false })

    const list = (users ?? []) as UserRow[]

    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-2xl font-bold text-gray-800'>管理コンソール</h1>
                <p className='mt-2 text-sm text-gray-600'>ユーザーの削除と権限変更ができます。</p>
            </div>

            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700'>
                adminはレビューとユーザー管理が可能です。最後のadminは削除できません。
            </div>

            {list.length === 0 ? (
                <div className='rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600'>
                    ユーザーが見つかりません。
                </div>
            ) : (
                <div className='space-y-4'>
                    {list.map(user => (
                        <UserAdminRow
                            key={user.id}
                            userId={user.id}
                            displayName={user.display_name ?? 'user'}
                            accountId={user.account_id ?? 'unknown'}
                            role={(user.role ?? 'member') as 'member' | 'admin'}
                            createdAt={user.created_at}
                            isSelf={user.id === auth.userId}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default ControlConsolePage
