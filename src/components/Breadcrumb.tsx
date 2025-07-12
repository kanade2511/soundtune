import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
}

const Breadcrumb = ({ items }: BreadcrumbProps) => {
    return (
        <nav className='flex items-center space-x-2 text-sm text-gray-500 mb-6'>
            <Link href='/' className='flex items-center hover:text-gray-700 transition-colors'>
                <Image
                    src='/images/logo/logo_small.png'
                    alt='SoundTune'
                    width={32}
                    height={32}
                    className='h-8 w-8'
                    priority
                />
            </Link>
            {items.map((item, index) => (
                <div key={`${item.label}-${index}`} className='flex items-center space-x-2'>
                    <ChevronRight className='h-4 w-4' />
                    {item.href ? (
                        <Link href={item.href} className='hover:text-blue-600 transition-colors'>
                            {item.label}
                        </Link>
                    ) : (
                        <span className='text-gray-900'>{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    )
}

export default Breadcrumb
