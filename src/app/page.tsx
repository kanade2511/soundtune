import Card from '@/components/Card'
import { getPublishedPosts } from '@/lib/articles'
import { format_read_time } from '@/lib/read-time'

export const dynamic = 'force-dynamic'

const Home = async () => {
    const posts = await getPublishedPosts()
    const cards = posts
        .filter(post => post.account_id)
        .map(post => ({
            key: post.post_id,
            href: `/${post.account_id}/${post.post_id}`,
            title: post.title,
            description: post.display_name ?? `@${post.account_id}`,
            readTime: format_read_time(post.read_time),
            date: new Date(post.created_at).toLocaleDateString('ja-JP'),
            thumbnail: post.thumbnail_url ?? undefined,
        }))
    return (
        <div className='min-h-screen'>
            {/* Main Content */}
            <main className='py-4 sm:py-8'>
                <div>
                    <h3 className='text-2xl font-bold text-gray-800 mb-6'>すべての投稿</h3>
                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                        {cards.map(card => (
                            <Card
                                key={card.key}
                                href={card.href}
                                title={card.title}
                                description={card.description}
                                readTime={card.readTime}
                                date={card.date}
                                thumbnail={card.thumbnail}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Home
