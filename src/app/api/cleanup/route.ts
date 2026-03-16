import { NextResponse } from 'next/server'
import kv from '@/lib/kv'
import { AIArticle } from '@/lib/types'

export async function POST(request: Request) {
  // 验证 API Key
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.REFRESH_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // 获取现有文章
    const existingArticlesJson = await kv.get('ai_articles')
    let existingArticles: AIArticle[] = []
    
    if (existingArticlesJson) {
      existingArticles = JSON.parse(existingArticlesJson)
    }

    // 过滤出评分低于75的文章
    const lowScoreArticles = existingArticles.filter(article => article.finalScore < 75)
    const highScoreArticles = existingArticles.filter(article => article.finalScore >= 75)

    // 存储过滤后的文章
    await kv.set('ai_articles', JSON.stringify(highScoreArticles))
    
    // 存储元数据
    await kv.set('ai_articles_metadata', JSON.stringify({
      lastUpdated: new Date().toISOString(),
      totalArticles: highScoreArticles.length
    }))

    return NextResponse.json({
      success: true,
      message: `Removed ${lowScoreArticles.length} articles with score < 75`,
      remainingArticles: highScoreArticles.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error cleaning up articles:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to clean up articles',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
