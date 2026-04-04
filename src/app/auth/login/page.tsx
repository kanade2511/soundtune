import GoogleLoginButton from '@/components/GoogleLoginButton'

export default function LoginPage() {
    return (
        <div className='flex min-h-[60vh] flex-col items-center justify-center gap-6'>
            <h1 className='text-2xl font-bold text-gray-800'>ログイン</h1>
            <GoogleLoginButton />
        </div>
    )
}
