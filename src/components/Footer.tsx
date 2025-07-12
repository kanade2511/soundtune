import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const Footer = () => {
    return (
        <footer className='bg-white border-t border-gray-200 mt-auto'>
            <div className='mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='py-8'>
                    <div className='flex items-center justify-center space-x-2 text-gray-600'>
                        <Link href='/'>
                            <Image
                                src='/images/logo/logo_normal.png'
                                alt='SoundTune'
                                height={1024}
                                width={1024}
                                className='h-10 w-auto'
                            />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
