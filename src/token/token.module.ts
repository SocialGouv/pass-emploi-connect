import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { RedisClient } from '../redis/redis.client'
import { RedisProvider } from '../redis/redis.provider'
import { TokenService } from './token.service'
import { JWTService } from './jwt.service'

@Module({
  imports: [ConfigModule],
  providers: [RedisProvider, RedisClient, TokenService, JWTService],
  exports: [RedisProvider, TokenService, JWTService]
})
export class TokenModule {}
