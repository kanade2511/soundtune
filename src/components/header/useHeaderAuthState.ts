'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'

const useHeaderAuthState = () => {
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

    const load_profile = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
            clear_profile_state()
            return
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url, display_name, account_id, role')
            .eq('id', userData.user.id)
            .single()

        set_is_logged_in(true)
        set_avatar_url(profile?.avatar_url ?? null)
        set_display_name(profile?.display_name ?? null)
        set_account_id(profile?.account_id ?? null)
        set_is_admin(profile?.role === 'admin')
    }, [clear_profile_state, supabase])

    useEffect(() => {
        let is_mounted = true

        const load_session = async () => {
            const { data } = await supabase.auth.getSession()
            if (!is_mounted) return

            if (!data.session) {
                clear_profile_state()
                return
            }

            await load_profile()
        }

        void load_session()

        const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!is_mounted) return
            if (!session) {
                clear_profile_state()
                return
            }

            await load_profile()
        })

        return () => {
            is_mounted = false
            subscription.subscription.unsubscribe()
        }
    }, [clear_profile_state, load_profile, supabase])

    return {
        is_logged_in,
        avatar_url,
        display_name,
        account_id,
        is_admin,
    }
}

export default useHeaderAuthState
