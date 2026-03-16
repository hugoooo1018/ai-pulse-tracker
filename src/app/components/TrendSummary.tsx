'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface TrendSummaryProps {
  summary: string
  lastUpdated: string
}

export default function TrendSummary({ summary, lastUpdated }: TrendSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="card mb-8">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-bold">AI 行业趋势分析</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">{lastUpdated}</span>
          {isExpanded ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div dangerouslySetInnerHTML={{ __html: summary }} />
        </div>
      )}
    </div>
  )
}
