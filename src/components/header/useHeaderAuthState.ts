'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

const useHeaderAuthState = () => {
    const [is_loading_auth, set_is_loading_auth] = useState(true)
    const [is_logged_in, set_is_logged_in] = useState(false)
    const [avatar_url, set_avatar_url] = useState<string | null>(null)
    const [display_name, set_display_name] = useState<string | null>(null)
    const [account_id, set_account_id] = useState<string | null>(null)
    const [is_admin, set_is_admin] = useState(false)

    const supabase = useMemo(() => createSupabaseBrowserClient(), [])

    const clear_profile_state = useCallback(() => {
        set_is_logged_in(false)
        set_avatar_url(null)
        set_display_name(null)
        set_account_id(null)
        set_is_admin(false)
    }, [])

    const clear_profile_details = useCallback(() => {
        set_avatar_url(null)
        set_display_name(null)
        set_account_id(null)
        set_is_admin(false)
    }, [])

    const load_profile = useCallback(
        async (user_id: string) => {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('avatar_url, display_name, account_id, role')
                .eq('id', user_id)
                .single()

            if (error || !profile) {
                clear_profile_details()
                return
            }

            set_avatar_url(profile.avatar_url ?? null)
            set_display_name(profile.display_name ?? null)
            set_account_id(profile.account_id ?? null)
            set_is_admin(profile.role === 'admin')
        },
        [clear_profile_details, supabase],
    )

    const hydrate_auth_state = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser()

        if (!userData.user) {
            clear_profile_state()
            set_is_loading_auth(false)
            return
        }

        set_is_logged_in(true)
        set_is_loading_auth(false)
        void load_profile(userData.user.id)
    }, [clear_profile_state, load_profile, supabase])

    useEffect(() => {
        let is_mounted = true

        const load_session = async () => {
            await hydrate_auth_state()
            if (!is_mounted) return
        }

        void load_session()

        const handle_profile_updated = () => {
            void hydrate_auth_state()
        }

        window.addEventListener('profile-updated', handle_profile_updated)

        const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!is_mounted) return
            if (!session) {
                clear_profile_state()
                set_is_loading_auth(false)
                return
            }

            set_is_logged_in(true)
            set_is_loading_auth(false)
            void load_profile(session.user.id)
        })

        return () => {
            is_mounted = false
            window.removeEventListener('profile-updated', handle_profile_updated)
            subscription.subscription.unsubscribe()
        }
    }, [clear_profile_state, hydrate_auth_state, load_profile, supabase])

    return {
        is_loading_auth,
        is_logged_in,
        avatar_url,
        display_name,
        account_id,
        is_admin,
    }
}

export default useHeaderAuthState
