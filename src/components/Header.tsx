import { Music } from 'lucide-react'
import Link from 'next/link'

const Header = () => {
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
                </div>
            </div>
        </header>
    )
}

export default Header
