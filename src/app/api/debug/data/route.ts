import { NextResponse } from 'next/server'
import kv from '@/lib/kv'

export async function GET() {
  try {
    // 从内存存储中获取文章数据
    const articlesData = await kv.get('ai_articles')
    const metadataData = await kv.get('ai_articles_metadata')
    
    // 解析文章数据
    const articles = articlesData ? JSON.parse(articlesData) : []
    const metadata = metadataData ? JSON.parse(metadataData) : null
    
    return NextResponse.json({
      success: true,
      data: {
        articles,
        metadata,
        count: articles.length
      }
    })
  } catch (error) {
    console.error('Error fetching debug data:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
