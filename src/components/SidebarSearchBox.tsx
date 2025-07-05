'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export const SidebarSearchBox = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search/${encodeURIComponent(searchQuery.trim())}`)
            setSearchQuery('')
        }
    }

    return (
        <div>
            <h3 className='text-lg font-bold text-gray-800 mb-4'>記事を検索</h3>
            <form onSubmit={handleSearch}>
                <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <Input
                        type='text'
                        placeholder='記事を検索'
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                if (searchQuery.trim()) {
                                    router.push(`/search/${encodeURIComponent(searchQuery.trim())}`)
                                    setSearchQuery('')
                                }
                            }
                        }}
                        className='pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus-visible:ring-transparent focus:shadow placeholder:text-gray-400 w-full'
                    />
                </div>
            </form>
        </div>
    )
}
