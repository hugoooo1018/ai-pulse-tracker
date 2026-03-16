import RSSParser from 'rss-parser'
import kv from '@/lib/kv'
import { AIArticle, DataSource } from '@/lib/types'
import { analyzeArticle, calculateFinalScore, filterAndSort, processInBatches } from '@/lib/ai-processor'
import { callMiniMax } from '@/lib/minimax-client'

// 数据源配置
export const DATA_SOURCES: DataSource[] = [
  { name: 'Hacker News', type: 'api', url: 'https://hacker-news.firebaseio.com/v0/topstories.json' },
  { name: 'TechCrunch AI', type: 'rss', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'MIT Tech Review', type: 'rss', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/' },
  { name: 'Wired AI', type: 'rss', url: 'https://www.wired.com/feed/tag/artificial-intelligence/latest/rss' },
  { name: 'Ars Technica AI', type: 'rss', url: 'https://feeds.arstechnica.com/arstechnica/ai' },
  { name: 'VentureBeat AI', type: 'rss', url: 'https://venturebeat.com/category/artificial-intelligence/feed/' },
  { name: 'AI Business', type: 'rss', url: 'https://aibusiness.com/rss' },
  { name: 'Machine Learning Mastery', type: 'rss', url: 'https://machinelearningmastery.com/blog/feed/' },
  { name: 'OpenAI Blog', type: 'rss', url: 'https://openai.com/blog/rss' },
  { name: 'Anthropic Blog', type: 'rss', url: 'https://www.anthropic.com/index.rss' },
  { name: 'BestBlogs AI', type: 'rss', url: 'https://www.bestblogs.dev/en/feeds/rss?category=ai&minScore=90' }
]

// 来源评分映射
export const SOURCE_SCORES: Record<string, number> = {
  'Hacker News': 8,
  'TechCrunch AI': 9,
  'MIT Tech Review': 9,
  'Wired AI': 9,
  'Ars Technica AI': 8,
  'VentureBeat AI': 8,
  'AI Business': 7,
  'Machine Learning Mastery': 8,
  'OpenAI Blog': 10,
  'Anthropic Blog': 10,
  'BestBlogs AI': 9
}

/**
 * 从 Hacker News API 获取文章
 */
export async function fetchHackerNews(): Promise<AIArticle[]> {
  try {
    const response = await fetch(DATA_SOURCES[0].url)
    const storyIds = await response.json() as number[]
    
    // 获取更多故事，以获取过去12个月的文章
    const topStories = storyIds.slice(0, 100) // 增加到100个
    const articles: AIArticle[] = []
    const oneYearAgo = Date.now() - 12 * 30 * 24 * 60 * 60 * 1000 // 12个月前的时间戳
    
    for (const id of topStories) {
      try {
        const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        const story = await storyResponse.json()
        
        if (story.title && story.url) {
          const storyTime = story.time * 1000
          // 只添加12个月内的文章
          if (storyTime >= oneYearAgo) {
            articles.push({
              id: story.id.toString(),
              title: story.title,
              url: story.url,
              source: 'Hacker News',
              publishedAt: new Date(storyTime).toISOString(),
              category: 'AI Application', // 临时值，后续会更新
              aiSummary: '',
              qualityScore: 0,
              sourceScore: SOURCE_SCORES['Hacker News'],
              finalScore: 0
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching Hacker News story ${id}:`, error)
      }
    }
    
    return articles
  } catch (error) {
    console.error('Error fetching Hacker News:', error)
    return []
  }
}

/**
 * 从 RSS 源获取文章
 */
export async function fetchRSS(url: string, source: string): Promise<AIArticle[]> {
  try {
    const parser = new RSSParser()
    const feed = await parser.parseURL(url)
    
    const oneYearAgo = Date.now() - 12 * 30 * 24 * 60 * 60 * 1000 // 12个月前的时间戳
    
    return feed.items
      .filter(item => {
        const itemDate = item.isoDate ? new Date(item.isoDate).getTime() : Date.now()
        return itemDate >= oneYearAgo
      })
      .slice(0, 50) // 增加到50个
      .map(item => ({
        id: item.guid || item.link || Math.random().toString(),
        title: item.title || '',
        url: item.link || '',
        source: source,
        publishedAt: item.isoDate || new Date().toISOString(),
        category: 'AI Application', // 临时值，后续会更新
        aiSummary: '',
        qualityScore: 0,
        sourceScore: SOURCE_SCORES[source],
        finalScore: 0
      }))
  } catch (error) {
    console.error(`Error fetching RSS from ${source}:`, error)
    return []
  }
}

/**
 * 主处理函数
 */
export async function processArticles() {
  try {
    // 顺序获取数据源，避免并行请求过多导致超时
    let allArticles: AIArticle[] = []
    
    // 先获取Hacker News
    const hackerNews = await fetchHackerNews()
    allArticles = [...allArticles, ...hackerNews]
    
    // 顺序获取RSS源
    for (let i = 1; i < DATA_SOURCES.length; i++) {
      const source = DATA_SOURCES[i]
      if (source.type === 'rss') {
        try {
          const rssArticles = await fetchRSS(source.url, source.name)
          allArticles = [...allArticles, ...rssArticles]
          // 短暂延迟，避免请求过于频繁
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error fetching ${source.name}:`, error)
          // 继续处理下一个源，不中断整个过程
        }
      }
    }
    
    // 合并所有文章
    let newArticles = allArticles
    
    // 去重
    const uniqueNewArticles = Array.from(
      new Map(newArticles.map(article => [article.url, article])).values()
    )
    
    // 分析每篇文章（限制处理数量，避免超时）
    const articlesToProcess = uniqueNewArticles.slice(0, 50) // 限制处理50篇文章
    const analyzedArticles = await processInBatches(articlesToProcess, 3, async (article) => {
      try {
        const analysis = await analyzeArticle(article)
        const finalScore = calculateFinalScore(analysis.qualityScore, article.sourceScore)
        
        return {
          ...article,
          category: analysis.category,
          aiSummary: analysis.aiSummary,
          qualityScore: analysis.qualityScore,
          finalScore: finalScore
        }
      } catch (error) {
        console.error(`Error analyzing article ${article.title}:`, error)
        // 返回原始文章，不中断处理
        return article
      }
    })
    
    // 过滤和排序
    const topNewArticles = filterAndSort(analyzedArticles)
    
    // 获取现有文章
    const existingArticlesJson = await kv.get('ai_articles')
    let existingArticles: AIArticle[] = []
    
    if (existingArticlesJson) {
      existingArticles = JSON.parse(existingArticlesJson)
    }
    
    // 合并新文章和现有文章，去重
    const mergedArticles = [...existingArticles, ...topNewArticles]
    const uniqueMergedArticles = Array.from(
      new Map(mergedArticles.map(article => [article.url, article])).values()
    )
    
    // 再次过滤和排序
    const finalArticles = filterAndSort(uniqueMergedArticles)
    
    // 存储文章到内存
    await kv.set('ai_articles', JSON.stringify(finalArticles))
    
    // 生成趋势分析报告
    const trendSummary = await generateTrendSummary(finalArticles)
    
    // 存储元数据
    await kv.set('ai_articles_metadata', JSON.stringify({
      lastUpdated: new Date().toISOString(),
      totalArticles: finalArticles.length,
      trendSummary: trendSummary
    }))
    
    return {
      success: true,
      message: `Processed ${topNewArticles.length} articles`,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error processing articles:', error)
    return {
      success: false,
      message: 'Failed to process articles',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 生成AI行业趋势分析报告
 */
export async function generateTrendSummary(articles: AIArticle[]): Promise<string> {
  try {
    const systemPrompt = `# Role
你是一位资深的 AI 行业分析师，专注于追踪全球 AI 产品动态、技术演进和商业趋势。你擅长从海量信息中识别关键信号，提供有洞察力的商业分析。

# Task
请基于以下追踪到的 AI 文章信息，输出一份简要的趋势分析报告。

# Input Data
文章数据（近 12个月）：
${JSON.stringify(articles)}

# Analysis Framework
请从以下维度进行分析：

1. **产品形态演变**
   - 新产品的主要形态是什么？（Agent、Copilot、垂直应用、基础设施等）
   - 产品交互方式有何变化？

2. **技术与能力迭代**
   - 模型能力有哪些突破？（多模态、长上下文、推理能力等）
   - 技术栈或架构的新趋势？

3. **应用场景聚焦**
   - 哪些垂直领域成为热点？
   - 从 ToC 还是 ToB 为主？

4. **商业化进展**
   - 定价策略、商业模式的变化
   - 大厂 vs 初创公司的竞争格局

5. **国内外差异**
   - 中美/海内外在产品方向、技术路线上的差异
   - 各自的优势领域

# Output Requirements
1. **篇幅**：500-800 字
2. **结构**：
   - 开篇：总体趋势概括（1-2 句）
   - 主体：3-4 个核心观察点，每点包含具体案例支撑
   - 结尾：基本判断/预测（1-2 句）
3. **风格**：
   - 专业、客观、有洞察
   - 避免泛泛而谈，要有具体数据或案例
   - 体现商业思考，而非单纯技术罗列
4. **语言**：简体中文

# Output Format
请按以下格式输出：

## 📊 总体趋势
[1-2 句概括]

## 🔍 核心观察

**观察一：[标题]**
[分析内容 + 具体案例]

**观察二：[标题]**
[分析内容 + 具体案例]

**观察三：[标题]**
[分析内容 + 具体案例]

## 💡 基本判断
[你的判断或预测]

---

现在请开始分析。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请基于提供的文章数据生成趋势分析报告' }
    ]

    const response = await callMiniMax(messages)
    const aiResponse = response.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('Invalid MiniMax response')
    }

    // 转换Markdown为HTML
    const htmlResponse = aiResponse
      .replace(/## (.*?)/g, '<h3>$1</h3>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')

    return htmlResponse
  } catch (error) {
    console.error('Error generating trend summary:', error)
    return '<p>生成趋势分析报告失败</p>'
  }
}
