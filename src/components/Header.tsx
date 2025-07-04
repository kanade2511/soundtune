'use client'

import { Input } from '@/components/ui/input'
import { Music, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const router = useRouter()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search/${encodeURIComponent(searchQuery.trim())}`)
            setSearchQuery('')
            setIsSearchOpen(false)
        }
    }

    return (
        <header className='border-b border-blue-200 bg-white/90'>
            <div className='container mx-auto px-4 py-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                        <Music className='h-6 w-6 text-blue-600' />
                        <h1 className='text-xl font-bold text-gray-800'>
                            <Link href='/' className='flex items-center space-x-2'>
                                SoundTune
                            </Link>
                        </h1>
                    </div>

                    <div className='flex items-center space-x-4'>
                        {/* Desktop Search Form */}
                        <div className='hidden md:flex items-center'>
                            <div
                                className={`transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'} overflow-hidden`}
                            >
                                {isSearchOpen && (
                                    <form onSubmit={handleSearch} className='mr-2'>
                                        <div className='relative'>
                                            <Input
                                                type='text'
                                                placeholder='記事を検索...'
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className='w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            />
                                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Search Toggle Button */}
                        <button
                            type='button'
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className='p-2 text-gray-600 hover:text-blue-600 transition-colors'
                            aria-label='検索'
                        >
                            <Search className='h-5 w-5' />
                        </button>
                    </div>
                </div>

                {/* Mobile Search Form */}
                {isSearchOpen && (
                    <div className='md:hidden mt-4'>
                        <form onSubmit={handleSearch}>
                            <div className='relative'>
                                <Input
                                    type='text'
                                    placeholder='記事を検索...'
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className='w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                />
                                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Header
