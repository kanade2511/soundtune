import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
    const current_year = new Date().getFullYear()

    return (
        <footer className='mt-12 border-t border-blue-200/80 bg-white/70 backdrop-blur-sm'>
            <div className='container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-gray-600 sm:px-8 lg:px-12 md:flex-row'>
                <Link
                    href='/'
                    className='flex items-center gap-3 transition-opacity hover:opacity-90'
                >
                    <Image
                        src='/logo/logo_normal.png'
                        alt='SoundTune'
                        width={1024}
                        height={1024}
                        className='h-7 w-auto'
                    />
                    <span className='text-xs tracking-wide text-gray-500'>
                        音楽好きのための情報共有コミュニティ
                    </span>
                </Link>
                <p className='text-xs text-gray-500'>
                    &copy; {current_year} SoundTune. All rights reserved.
                </p>
            </div>
        </footer>
    )
}

export default Footer
