import { promises as fs } from 'node:fs'
import path from 'node:path'
import Card from '@/components/Card'
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

    // 日付順にソート（新しい順）
    articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return articles
}

const Home = async () => {
    const articles = await getArticles()

    return (
        <div className='min-h-screen'>
            {/* メインコンテンツ */}
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
        </div>
    )
}

export default Home
