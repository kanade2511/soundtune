import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DeleteAccountForm from './delete-account-form'
import ProfileForm from './profile-form'

const ProfilePage = async () => {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
        redirect('/auth/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, account_id, avatar_url')
        .eq('id', userData.user.id)
        .single()

    if (!profile) {
        return (
            <div className='rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800'>
                プロフィールが見つかりません
            </div>
        )
    }

    return (
        <div className='space-y-8'>
            <h1 className='text-2xl font-bold text-gray-800'>プロフィール</h1>
            <div className='flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
                {profile.avatar_url ? (
                    <Image
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        width={64}
                        height={64}
                        className='h-16 w-16 rounded-full object-cover'
                    />
                ) : (
                    <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-600'>
                        {profile.display_name?.slice(0, 1) ?? 'U'}
                    </div>
                )}
                <div className='space-y-1'>
                    <p className='text-lg font-semibold text-gray-800'>{profile.display_name}</p>
                    <p className='text-sm text-gray-500'>@{profile.account_id}</p>
                </div>
            </div>

            <ProfileForm displayName={profile.display_name} accountId={profile.account_id} />
            <DeleteAccountForm />
        </div>
    )
}

export default ProfilePage
