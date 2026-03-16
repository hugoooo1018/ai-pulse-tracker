import { RefreshCw } from 'lucide-react'
import kv from '@/lib/kv'
import { AIArticle } from '@/lib/types'
import RefreshButton from './components/RefreshButton'
import ArticleTabs from './components/ArticleTabs'
import TrendSummary from './components/TrendSummary'

interface Metadata {
  lastUpdated: string
  totalArticles: number
  trendSummary?: string
}

async function getArticles(): Promise<{
  articles: AIArticle[]
  metadata: Metadata | null
}> {
  try {
    // 从 KV 获取文章数据
    const articlesData = await kv.get('ai_articles')
    const metadataData = await kv.get('ai_articles_metadata')
    
    console.log('Articles data:', articlesData)
    console.log('Metadata data:', metadataData)
    
    const articles: AIArticle[] = articlesData ? JSON.parse(articlesData as string) : []
    const metadata = metadataData ? JSON.parse(metadataData as string) : null
    
    console.log('Parsed articles:', articles)
    console.log('Parsed metadata:', metadata)
    
    return { articles, metadata }
  } catch (error) {
    console.error('Error fetching articles:', error)
    return { articles: [], metadata: null }
  }
}

export default async function Home() {
  const { articles, metadata } = await getArticles()

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Pulse Tracker</h1>
          <RefreshButton />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {metadata && (
          <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Last updated: {formatDate(metadata.lastUpdated)}
          </div>
        )}
        
        {metadata?.trendSummary && (
          <TrendSummary 
            summary={metadata.trendSummary} 
            lastUpdated={formatDate(metadata.lastUpdated)} 
          />
        )}
        
        <ArticleTabs articles={articles} />
      </main>
      
      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          AI Pulse Tracker © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
