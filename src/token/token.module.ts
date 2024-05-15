import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { ContextStorageModule } from '../context-storage/context-storage.module'
import { RedisClient } from '../redis/redis.client'
import { RedisProvider } from '../redis/redis.provider'
import { GetAccessTokenUsecase } from './get-access-token.usecase'
import { TokenService } from './token.service'
import { ValidateJWTUsecase } from './verify-jwt.usecase'

@Module({
  imports: [ConfigModule, ContextStorageModule],
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
