import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    /* config options here */
    async rewrites() {
        return []
    },
    // 日本語URL対応
    trailingSlash: false,
    skipTrailingSlashRedirect: true,
}

export default nextConfig
