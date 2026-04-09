import type { NextConfig } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined

const remotePatterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [
    {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
    },
]

if (supabaseHostname) {
    remotePatterns.push({
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
    })
}

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns,
    },
    async rewrites() {
        return []
    },
    // 日本語URL対応
    trailingSlash: false,
    skipTrailingSlashRedirect: true,
}

export default nextConfig
