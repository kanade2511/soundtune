import Card from '@/components/Card'
import { getPublishedPosts } from '@/lib/articles'
import { format_read_time } from '@/lib/read-time'

export const dynamic = 'force-dynamic'

const get_description = (content: string) => {
    const normalized = content.replace(/\s+/g, ' ').trim()
    return normalized.length > 120 ? `${normalized.slice(0, 120)}...` : normalized
}

const Home = async () => {
    const posts = await getPublishedPosts()
    const cards = posts
        .filter(post => post.account_id)
        .map(post => ({
            key: post.article_id,
            href: `/${post.account_id}/notes/${post.article_id}`,
            title: post.title,
            description: get_description(post.content),
            readTime: format_read_time(post.read_time),
            date: new Date(post.created_at).toLocaleDateString('ja-JP'),
            thumbnail: post.thumbnail_url ?? undefined,
        }))
    return (
        <div className='min-h-screen'>
            {/* Main Content */}
            <main className='container mx-auto px-4 py-12'>
                <div>
                    <h3 className='text-2xl font-bold text-gray-800 mb-6'>すべての記事</h3>
                    <div className='grid gap-6 md:grid-cols-2'>
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
