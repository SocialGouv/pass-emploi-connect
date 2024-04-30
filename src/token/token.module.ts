import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { ContextModule } from '../context/context.module'
import { RedisClient } from '../redis/redis.client'
import { RedisProvider } from '../redis/redis.provider'
import { GetAccessTokenUsecase } from './get-access-token.usecase'
import { TokenService } from './token.service'
import { ValidateJWTUsecase } from './verify-jwt.usecase'

@Module({
  imports: [ConfigModule, ContextModule],
  providers: [
    RedisProvider,
    RedisClient,
    TokenService,
    ValidateJWTUsecase,
    GetAccessTokenUsecase
  ],
  exports: [
    RedisProvider,
    TokenService,
    ValidateJWTUsecase,
    GetAccessTokenUsecase
  ]
})
export class TokenModule {}
