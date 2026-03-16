'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AIArticle } from '@/lib/types'
import { ArrowRight } from 'lucide-react'

interface ArticleTabsProps {
  articles: AIArticle[]
}

// 生成星级评分
function StarRating(score: number) {
  const stars = []
  const fullStars = Math.floor(score / 20)
  const halfStar = score % 20 >= 10
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<span key={i} className="text-yellow-500">★</span>)
    } else if (i === fullStars && halfStar) {
      stars.push(<span key={i} className="text-yellow-500">★</span>)
    } else {
      stars.push(<span key={i} className="text-gray-300">☆</span>)
    }
  }
  
  return <div className="flex items-center gap-1">{stars}</div>
}

export default function ArticleTabs({ articles }: ArticleTabsProps) {
  // 按分类过滤文章
  const aiAppArticles = articles.filter(article => article.category === 'AI Application')
  const infraArticles = articles.filter(article => article.category === 'AI Infra')
  const llmModelArticles = articles.filter(article => article.category === 'LLM Model')

  // 计算分类平均评分
  const calculateAverageScore = (articles: AIArticle[]) => {
    if (articles.length === 0) return 0
    const totalScore = articles.reduce((sum, article) => sum + article.finalScore, 0)
    return totalScore / articles.length
  }

  const aiAppAvgScore = calculateAverageScore(aiAppArticles)
  const infraAvgScore = calculateAverageScore(infraArticles)
  const llmModelAvgScore = calculateAverageScore(llmModelArticles)
  const allAvgScore = calculateAverageScore(articles)

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 渲染文章卡片
  const renderArticleCard = (article: AIArticle) => (
    <div key={article.id} className="card mb-6 flex flex-col h-full">
      <div className="flex-grow">
        <h3 className="text-xl font-bold mb-3 min-h-[60px]">
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {article.title}
          </a>
        </h3>
        <p className="text-[var(--text-secondary)] mb-6 min-h-[60px]">
          {article.aiSummary}
        </p>
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-300">
          <div className="w-1/3">
            <div className="date-tag">DATE</div>
            <div className="text-sm">{formatDate(article.publishedAt)}</div>
          </div>
          <div className="w-1/3 text-center">
            <div className="category-tag">CATEGORY</div>
            <div className="text-sm">{article.category}</div>
          </div>
          <div className="w-1/3 text-right">
            <div className="category-tag">SCORE</div>
            <div className="text-sm">{article.finalScore.toFixed(1)}</div>
          </div>
        </div>
      </div>
      <a 
        href={article.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="btn w-fit mt-auto"
      >
        Read more <ArrowRight size={16} />
      </a>
    </div>
  )

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-8 bg-transparent border-b border-gray-300 flex w-full">
        <TabsTrigger value="all" className="py-2 px-4 border-b-2 border-transparent hover:border-gray-400 data-[state=active]:border-black rounded-none flex-grow text-center">
          All <span className="ml-2 text-sm opacity-70">({articles.length})</span>
        </TabsTrigger>
        <TabsTrigger value="ai-app" className="py-2 px-4 border-b-2 border-transparent hover:border-gray-400 data-[state=active]:border-black rounded-none flex-grow text-center">
          AI Application <span className="ml-2 text-sm opacity-70">({aiAppArticles.length})</span>
        </TabsTrigger>
        <TabsTrigger value="infra" className="py-2 px-4 border-b-2 border-transparent hover:border-gray-400 data-[state=active]:border-black rounded-none flex-grow text-center">
          AI Infra <span className="ml-2 text-sm opacity-70">({infraArticles.length})</span>
        </TabsTrigger>
        <TabsTrigger value="llm-model" className="py-2 px-4 border-b-2 border-transparent hover:border-gray-400 data-[state=active]:border-black rounded-none flex-grow text-center">
          LLM Model <span className="ml-2 text-sm opacity-70">({llmModelArticles.length})</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="all">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map(renderArticleCard)}
          </div>
        ) : (
          <p className="text-center py-12 text-[var(--text-secondary)]">No articles found</p>
        )}
      </TabsContent>
      
      <TabsContent value="ai-app">
        {aiAppArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiAppArticles.map(renderArticleCard)}
          </div>
        ) : (
          <p className="text-center py-12 text-[var(--text-secondary)]">No AI Application articles found</p>
        )}
      </TabsContent>
      
      <TabsContent value="infra">
        {infraArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {infraArticles.map(renderArticleCard)}
          </div>
        ) : (
          <p className="text-center py-12 text-[var(--text-secondary)]">No AI Infra articles found</p>
        )}
      </TabsContent>
      
      <TabsContent value="llm-model">
        {llmModelArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {llmModelArticles.map(renderArticleCard)}
          </div>
        ) : (
          <p className="text-center py-12 text-[var(--text-secondary)]">No LLM Model articles found</p>
        )}
      </TabsContent>
    </Tabs>
  )
}
