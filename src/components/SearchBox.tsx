'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { forwardRef, useEffect, useRef, useState } from 'react'

interface SearchBoxProps {
    variant?: 'header' | 'sidebar'
    title?: string
}

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
    ({ variant = 'header', title }, ref) => {
        const [searchQuery, setSearchQuery] = useState('')
        const router = useRouter()
        const internalRef = useRef<HTMLInputElement>(null)
        const searchInputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef

        const handleSearch = (e: React.FormEvent) => {
            e.preventDefault()
            if (searchQuery.trim()) {
                router.push(`/search/${encodeURIComponent(searchQuery.trim())}`)
                setSearchQuery('')
            }
        }

        useEffect(() => {
            if (variant === 'header') {
                const down = (e: KeyboardEvent) => {
                    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault()
                        searchInputRef.current?.focus()
                    }
                }
                document.addEventListener('keydown', down)
                return () => document.removeEventListener('keydown', down)
            }
        }, [searchInputRef, variant])

        if (variant === 'sidebar') {
            return (
                <div>
                    {title && <h3 className='text-lg font-bold text-gray-800 mb-4'>{title}</h3>}
                    <form onSubmit={handleSearch}>
                        <div className='relative'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                            <Input
                                ref={searchInputRef}
                                type='text'
                                placeholder='記事を検索'
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
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
                                className='pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus-visible:ring-transparent focus:shadow placeholder:text-gray-400 w-full'
                            />
                        </div>
                    </form>
                </div>
            )
        }

        return (
            <div className='hidden md:flex items-center'>
                <form onSubmit={handleSearch} className='mr-2'>
                    <div className='relative w-64'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <Input
                            ref={searchInputRef}
                            type='text'
                            placeholder='記事を検索'
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
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
                            className='pl-10 pr-20 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus-visible:ring-transparent focus:shadow placeholder:text-gray-400'
                        />
                        <div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1'>
                            <kbd className='inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-500'>
                                Ctrl
                            </kbd>
                            <kbd className='inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-500'>
                                K
                            </kbd>
                        </div>
                    </div>
                </form>
            </div>
        )
    },
)

SearchBox.displayName = 'SearchBox'
