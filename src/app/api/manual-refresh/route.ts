import { NextResponse } from 'next/server'
import { processArticles } from '@/lib/article-processor'

export async function POST(request: Request) {
  // 验证 API Key
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.REFRESH_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 调用与 cron 相同的处理函数
  const result = await processArticles()
  return NextResponse.json(result)
}
