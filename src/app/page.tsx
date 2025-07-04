import { Music } from 'lucide-react'
import Link from 'next/link'

const Home = () => {
    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
            {/* Header */}
            <header className='border-b border-blue-200 bg-white/90'>
                <div className='container mx-auto px-4 py-4'>
                    <div className='flex items-center justify-between'>
                        <Link
                            href='/'
                            className='flex items-center space-x-2 hover:opacity-80 transition-opacity'
                        >
                            <Music className='h-6 w-6 text-blue-600' />
                            <h1 className='text-xl font-bold text-gray-800'>SoundTune</h1>
                        </Link>
                    </div>
                </div>
            </header>
        </div>
    )
}

export default Home
