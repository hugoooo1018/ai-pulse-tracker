import { callMiniMax } from './minimax-client'
import { AIArticle, AnalysisResult } from './types'

/**
 * 分析文章内容
 * @param article 文章对象
 * @returns 分析结果
 */
export async function analyzeArticle(article: {
  title: string
  content?: string
  source: string
}): Promise<AnalysisResult> {
  try {
    const systemPrompt = `你是一个 AI 行业分析师。分析以下新闻内容：
1. 分类：从 [AI Application, AI Infra, LLM Model] 中选择最匹配的一个
2. 质量评分：0-100 分，基于以下标准：
   - 【90-100分】首发重大新闻、里程碑级发布
   - 【80-89分】重要技术进展、知名大佬的核心观点、深度长文
   - 【70-79分】实用工具更新、有价值的教程、行业数据报告
   - 【60-69分】二手信息、一般性新闻、小道消息
   - 【<60分】低价值/局部内容：纯情绪宣泄、无营养的评价、广告、日常闲聊
3. 一句话亮点：提取最核心的价值点（50 字以内）

请只返回 JSON 格式，不要其他文字：
{
  "category": "AI Application",
  "qualityScore": 85,
  "aiSummary": "xxx"
}`

    const content = article.content || article.title
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `标题：${article.title}\n内容：${content}` }
    ]

    const response = await callMiniMax(messages)
    const aiResponse = response.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('Invalid MiniMax response')
    }

    // 解析 AI 返回的 JSON
    // 处理可能包含代码块标记的响应
    let cleanResponse = aiResponse
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace('```json', '').replace('```', '').trim()
    }
    const result = JSON.parse(cleanResponse) as AnalysisResult
    return result
  } catch (error) {
    console.error('Error analyzing article:', error)
    // 出错时返回默认值
    return {
      category: 'AI Application',
      qualityScore: 50,
      aiSummary: '分析失败，无法生成摘要'
    }
  }
}

/**
 * 计算最终分数
 * @param qualityScore 质量评分
 * @param sourceScore 来源评分
 * @returns 最终分数
 */
export function calculateFinalScore(qualityScore: number, sourceScore: number): number {
  // 将sourceScore从0-10映射到0-100
  const normalizedSourceScore = (sourceScore / 10) * 100
  return qualityScore * 0.7 + normalizedSourceScore * 0.3
}

/**
 * 过滤和排序文章
 * @param articles 文章数组
 * @returns 过滤排序后的文章数组
 */
export function filterAndSort(articles: AIArticle[]): AIArticle[] {
  return articles
    .filter(article => article.finalScore >= 75)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 5000000) // 增加文章数量限制到5000000篇
}

/**
 * 分批处理文章
 * @param articles 文章数组
 * @param batchSize 批次大小
 * @param processor 处理函数
 * @returns 处理后的文章数组
 */
export async function processInBatches<T>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<T>
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const processedBatch = await Promise.all(batch.map(processor))
    results.push(...processedBatch)
  }
  
  return results
}
