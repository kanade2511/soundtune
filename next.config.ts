import type { NextConfig } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: supabaseHostname
            ? [
                  {
                      protocol: 'https',
                      hostname: supabaseHostname,
                      pathname: '/storage/v1/object/public/**',
                  },
              ]
            : [],
    },
    async rewrites() {
        return []
    },
    // 日本語URL対応
    trailingSlash: false,
    skipTrailingSlashRedirect: true,
}

export default nextConfig
