import { promises as fs } from 'node:fs'
import path from 'node:path'
import ArticleCard from '@/components/ArticleCard'
import matter from 'gray-matter'

interface Article {
    slug: string
    title: string
    category: string
    description: string
    readTime: string
    date: string
    tags: string[]
}

const getArticles = async (): Promise<Article[]> => {
    const articlesDir = path.join(process.cwd(), 'src', 'notes')
    const filenames = await fs.readdir(articlesDir)
    const markdownFiles = filenames.filter(name => name.endsWith('.md'))

    const articles: Article[] = []

    for (const filename of markdownFiles) {
        const filePath = path.join(articlesDir, filename)
        const fileContent = await fs.readFile(filePath, 'utf8')
        const { data } = matter(fileContent)

        const slug = filename.replace('.md', '')

        articles.push({
            slug,
            title: data.title || 'タイトル',
            category: data.category || '一般',
            description: data.description || '説明文',
            readTime: data.readTime || '5分',
            date: data.date || '2025-07-04',
            tags: data.tags || [],
        })
    }

    return articles
}

const Home = async () => {
    const articles = await getArticles()

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
            {/* Main Content */}
            <main className='container mx-auto px-4 py-12'>
                <div className='text-center mb-12'>
                    <h2 className='text-4xl font-bold text-gray-800 mb-4'>
                        音楽ノート & 楽器ガイド
                    </h2>
                    <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
                        楽器の使い方や音楽機器の操作方法を分かりやすいノートで解説します
                    </p>
                </div>

                {/* Blog Posts */}
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                    {articles.map(article => (
                        <ArticleCard
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
            </main>
        </div>
    )
}

export default Home
