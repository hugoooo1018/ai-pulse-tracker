// 核心数据结构定义
export interface AIArticle {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
  category: 'AI Application' | 'AI Infra' | 'LLM Model'
  aiSummary: string
  qualityScore: number
  sourceScore: number
  finalScore: number
}

// 数据源配置接口
export interface DataSource {
  name: string
  type: 'api' | 'rss'
  url: string
}

// AI 分析结果接口
export interface AnalysisResult {
  category: 'AI Application' | 'AI Infra' | 'LLM Model'
  qualityScore: number
  aiSummary: string
}
