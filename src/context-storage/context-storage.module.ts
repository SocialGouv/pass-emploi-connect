import { Module } from '@nestjs/common'

import { ContextStorage } from './context-storage.provider'
import { RedisProvider } from '../redis/redis.provider'
import { RedisClient } from '../redis/redis.client'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule],
  providers: [ContextStorage, RedisProvider, RedisClient],
  exports: [ContextStorage]
})
export class ContextStorageModule {}
