'use client'

import { Command, CommandInput } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import Image from 'next/image'
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
        <header className='sticky top-0 z-50 border-b border-blue-200 bg-white/90 backdrop-blur-sm h-20'>
            <div className='container mx-auto px-4 h-full'>
                <div className='flex items-center justify-between h-full'>
                    <div className='flex items-center space-x-2'>
                        <Link href='/'>
                            {/* Desktop Logo */}
                            <Image
                                src='/logo_normal.png'
                                alt='SoundTune'
                                height={1024}
                                width={1024}
                                className='hidden md:block h-12 w-auto'
                                priority
                            />
                            {/* Mobile Logo */}
                            <Image
                                src='/logo_mobile.png'
                                alt='SoundTune'
                                height={256}
                                width={256}
                                className='block md:hidden h-10 w-auto'
                                priority
                            />
                        </Link>
                    </div>

                    <div className='flex items-center space-x-4'>
                        {/* Desktop Search Form */}
                        <div className='hidden md:flex items-center'>
                            <form onSubmit={handleSearch} className='mr-2'>
                                <div className='relative'>
                                    <Command className='w-64 bg-white border border-gray-200 rounded-lg'>
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
