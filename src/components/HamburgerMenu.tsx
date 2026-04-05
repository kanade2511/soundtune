'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'

interface HamburgerMenuProps {
    isOpen: boolean
    onToggle: () => void
}

const HamburgerMenu = ({ isOpen, onToggle }: HamburgerMenuProps) => {
    // メニューが開いているときは背景のスクロールを無効にする
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        // クリーンアップ
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const menu_items = [{ href: '/', label: 'ホーム' }]

    return (
        <>
            {/* ハンバーガーメニューボタン */}
            <div className='relative z-50 flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10'>
                <button
                    type='button'
                    onClick={onToggle}
                    className='group flex h-full w-full flex-col items-center justify-center rounded-md bg-white/90 p-1 transition-colors duration-200 hover:bg-white focus:outline-none'
                    aria-label='メニューを開く'
                    aria-expanded={isOpen}
                    aria-controls='global-menu-panel'
                >
                    <div className='relative w-6 h-6 flex flex-col justify-center items-center'>
                        {/* 1本目の線 */}
                        <span
                            className={`absolute block w-6 h-0.5 bg-gray-600 group-hover:bg-gray-800 transition-all duration-300 ease-in-out transform ${
                                isOpen ? 'rotate-45 translate-y-0' : 'rotate-0 -translate-y-2'
                            }`}
                        />
                        {/* 2本目の線 */}
                        <span
                            className={`absolute block w-6 h-0.5 bg-gray-600 group-hover:bg-gray-800 transition-all duration-300 ease-in-out ${
                                isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                            }`}
                        />
                        {/* 3本目の線 */}
                        <span
                            className={`absolute block w-6 h-0.5 bg-gray-600 group-hover:bg-gray-800 transition-all duration-300 ease-in-out transform ${
                                isOpen ? '-rotate-45 translate-y-0' : 'rotate-0 translate-y-2'
                            }`}
                        />
                    </div>
                </button>
            </div>

            {/* 全画面メニュー */}
            <div
                id='global-menu-panel'
                className={`fixed inset-0 w-full h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100 transition-all duration-300 ease-[cubic-bezier(0.11,0.24,0.64,1)] ${
                    isOpen ? 'z-40 opacity-100 visible' : '-z-10 opacity-0 invisible'
                }`}
            >
                <div className='flex justify-center items-center h-full py-8'>
                    <div className='w-full max-w-sm sm:max-w-md'>
                        {/* ナビゲーションメニュー */}
                        <nav>
                            <div className='text-center mb-8'>
                                {/* ロゴ画像 - アスペクト比9:2を維持しつつレスポンシブ対応 */}
                                <Link href='/' onClick={onToggle}>
                                    <div className='relative mx-auto mb-6 w-full px-4'>
                                        <div className='max-w-[270px] sm:max-w-[320px] md:max-w-[360px] w-full mx-auto'>
                                            <div className='relative aspect-[9/2] w-full'>
                                                <Image
                                                    src='/logo/logo_normal.png'
                                                    alt='SoundTune'
                                                    fill
                                                    className='object-contain'
                                                    sizes='(max-width: 640px) 270px, (max-width: 768px) 320px, 360px'
                                                    priority
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>

                            <ul className='space-y-0 mt-10'>
                                {menu_items.map((item, index) => (
                                    <li
                                        key={item.href}
                                        className={`text-center overflow-hidden pb-[3px] ${
                                            index !== 0 ? 'mt-[30px]' : ''
                                        }`}
                                    >
                                        <Link
                                            href={item.href}
                                            onClick={onToggle}
                                            className={`inline-block text-lg text-gray-800 no-underline tracking-[1.3px] relative transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:text-blue-600 group/link ${
                                                isOpen
                                                    ? 'opacity-100 translate-y-0'
                                                    : 'opacity-0 translate-y-full'
                                            }`}
                                            style={{
                                                transitionDelay: isOpen
                                                    ? `${150 * (index + 1)}ms`
                                                    : '0ms',
                                            }}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </>
    )
}

export default HamburgerMenu
