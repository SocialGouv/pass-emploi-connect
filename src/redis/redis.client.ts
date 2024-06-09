import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { Redis } from 'ioredis'
import { RedisInjectionToken } from './redis.provider'

@Injectable()
export class RedisClient implements OnModuleDestroy {
  constructor(
    @Inject(RedisInjectionToken) private readonly redisClient: Redis
  ) {}

  onModuleDestroy(): void {
    this.redisClient.disconnect()
  }

  async get(prefix: string, key: string): Promise<string | null> {
    return this.redisClient.get(`${prefix}:${key}`)
  }

  async set(prefix: string, key: string, value: string): Promise<void> {
    await this.redisClient.set(`${prefix}:${key}`, value)
  }

  async delete(prefix: string, key: string): Promise<void> {
    await this.redisClient.del(`${prefix}:${key}`)
  }

  async deletePattern(pattern: string): Promise<void> {
    const keys = await this.redisClient.keys(`*${pattern}*`)
    for (const key of keys) {
      await this.redisClient.del(key.replace('oidc:', ''))
    }
  }

  async setWithExpiry(
    prefix: string,
    key: string,
    value: string,
    expiry: number
  ): Promise<void> {
    await this.redisClient.set(`${prefix}:${key}`, value, 'EX', expiry)
  }
}
