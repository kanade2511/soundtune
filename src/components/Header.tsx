'use client'

import { Command, CommandInput } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Music, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()
    const searchInputRef = useRef<HTMLInputElement>(null)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search/${encodeURIComponent(searchQuery.trim())}`)
            setSearchQuery('')
        }
    }

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

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
                            <form onSubmit={handleSearch} className='mr-2'>
                                <div className='relative'>
                                    <Command className='w-64 bg-white border border-gray-200 rounded-lg '>
                                        <CommandInput
                                            ref={searchInputRef}
                                            placeholder='記事を検索'
                                            value={searchQuery}
                                            onValueChange={setSearchQuery}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    if (searchQuery.trim()) {
                                                        router.push(
                                                            `/search/${encodeURIComponent(searchQuery.trim())}`,
                                                        )
                                                        setSearchQuery('')
                                                    }
                                                }
                                            }}
                                            className='px-4 py-2.5 text-sm bg-transparent focus:outline-none placeholder:text-gray-400 border-0'
                                        />
                                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                                        <div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1'>
                                            <kbd className='inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-500'>
                                                Ctrl
                                            </kbd>
                                            <kbd className='inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-500'>
                                                K
                                            </kbd>
                                        </div>
                                    </Command>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
