import { NextResponse } from 'next/server'
import { processArticles } from '@/lib/article-processor'

export async function GET() {
  const result = await processArticles()
  return NextResponse.json(result)
}
