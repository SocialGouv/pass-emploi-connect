import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { RedisClient } from '../redis/redis.client'
import { RedisProvider } from '../redis/redis.provider'
import { TokenService } from './token.service'
import { JWTService } from './jwt.service'
import { GetAccessTokenUsecase } from './get-access-token.usecase'

@Module({
  imports: [ConfigModule],
  providers: [
    RedisProvider,
    RedisClient,
    TokenService,
    JWTService,
    GetAccessTokenUsecase
  ],
  exports: [RedisProvider, TokenService, JWTService, GetAccessTokenUsecase]
})
export class TokenModule {}
