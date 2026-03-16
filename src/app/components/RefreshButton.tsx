'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function RefreshButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/manual-refresh', {
        method: 'POST',
        headers: {
          'x-api-key': 'test123'
        }
      })
      const result = await response.json()
      if (result.success) {
        // 刷新页面
        window.location.reload()
      }
    } catch (error) {
      console.error('Error refreshing articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      className="btn"
    >
      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
      {isLoading ? 'Refreshing...' : 'Refresh'}
    </button>
  )
}
