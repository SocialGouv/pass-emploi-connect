import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { TokenExchangeGrant } from './token-exchange.grant'
import { RedisClient } from '../redis/redis.client'
import { RedisProvider } from '../redis/redis.provider'
import { TokenService } from './token.service'

@Module({
  imports: [ConfigModule],
  providers: [RedisProvider, RedisClient, TokenService, TokenExchangeGrant],
  exports: [RedisProvider, TokenService, TokenExchangeGrant]
})
export class TokenModule {}
