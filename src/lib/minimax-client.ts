const MINIMAX_BASE_URL = 'https://api.minimax.chat/v1'

/**
 * 调用 MiniMax API 进行对话
 * @param messages 消息数组
 * @returns API 响应
 */
export async function callMiniMax(messages: Array<{role: string, content: string}>) {
  try {
    const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        messages: messages,
        temperature: 0.3,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error calling MiniMax API:', error)
    throw error
  }
}
