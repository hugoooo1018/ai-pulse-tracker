import { Redis } from '@upstash/redis'

// 为 globalThis 添加类型声明
declare global {
  var __AI_PULSE_TRACKER_STORAGE: {
    data: Map<string, any>
    sortedSets: Map<string, Map<string, number>>
  }
}

// 全局内存存储，用于本地开发
// 使用 globalThis 确保在不同模块和请求之间保持数据一致性
if (!globalThis.__AI_PULSE_TRACKER_STORAGE) {
  globalThis.__AI_PULSE_TRACKER_STORAGE = {
    data: new Map<string, any>(),
    sortedSets: new Map<string, Map<string, number>>()
  }
}

// 内存存储，用于本地开发
class MemoryKV {
  private storage = globalThis.__AI_PULSE_TRACKER_STORAGE

  async get(key: string) {
    return this.storage.data.get(key)
  }

  async set(key: string, value: any) {
    this.storage.data.set(key, value)
    return 'OK'
  }

  async del(key: string) {
    this.storage.data.delete(key)
    this.storage.sortedSets.delete(key)
    return 1
  }

  async zadd(key: string, ...args: any[]) {
    if (!this.storage.sortedSets.has(key)) {
      this.storage.sortedSets.set(key, new Map())
    }
    const sortedSet = this.storage.sortedSets.get(key)!
    
    let members: { score: number; member: string }[] = []
    
    // 处理不同的参数格式
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      // 格式: zadd(key, { score, member })
      if (args[0].score !== undefined && args[0].member !== undefined) {
        members = [args[0]]
      }
    } else if (Array.isArray(args[0])) {
      // 格式: zadd(key, [{ score, member }, ...])
      members = args[0]
    } else if (args.length > 0) {
      // 格式: zadd(key, score1, member1, score2, member2, ...)
      for (let i = 0; i < args.length; i += 2) {
        if (i + 1 < args.length) {
          members.push({
            score: Number(args[i]),
            member: args[i + 1]
          })
        }
      }
    }
    
    members.forEach(({ score, member }) => {
      sortedSet.set(member, score)
    })
    return members.length
  }

  async zrange(key: string, start: number, stop: number, options?: { rev?: boolean }) {
    if (!this.storage.sortedSets.has(key)) {
      return []
    }
    const sortedSet = this.storage.sortedSets.get(key)!
    const entries = Array.from(sortedSet.entries())
    entries.sort((a, b) => a[1] - b[1])
    if (options?.rev) {
      entries.reverse()
    }
    return entries.slice(start, stop + 1).map(([member]) => member)
  }
}

// 检查是否在生产环境或有 Redis 配置
const isRedisConfigured = process.env.REDIS_URL && process.env.REDIS_URL !== 'your_redis_url'

// 创建 Redis 客户端
const kv = isRedisConfigured 
  ? new Redis({
      url: process.env.REDIS_URL || '',
      token: 'default', // 使用默认token，因为URL中已经包含了认证信息
    })
  : new MemoryKV()

export default kv
