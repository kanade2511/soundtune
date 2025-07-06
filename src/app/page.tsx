import Card from '@/components/Card'
import { getAllArticles } from '@/lib/articles'

const Home = async () => {
    const articles = await getAllArticles()

    return (
        <div className='min-h-screen'>
            {/* Main Content */}
            <main className='container mx-auto px-4 py-12'>
                {/* Header */}
                <div className='text-center mb-12'>
                    <h2 className='text-4xl font-bold text-gray-800 mb-4'>
                        音楽ノート & 楽器ガイド
                    </h2>
                    <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
                        楽器の使い方や音楽機器の操作方法を分かりやすいノートで解説します
                    </p>
                </div>

                <div>
                    <h3 className='text-2xl font-bold text-gray-800 mb-6'>すべての記事</h3>
                    <div className='grid gap-6 md:grid-cols-2'>
                        {articles.map(article => (
                            <Card
                                key={article.slug}
                                slug={article.slug}
                                title={article.title}
                                category={article.category}
                                description={article.description}
                                readTime={article.readTime}
                                date={article.date}
                                tags={article.tags}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Home
