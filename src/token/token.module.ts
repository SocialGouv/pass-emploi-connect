import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { RedisClient } from '../redis/redis.client'
import { RedisProvider } from '../redis/redis.provider'
import { DateService } from '../utils/date.service'
import { GetAccessTokenUsecase } from './get-access-token.usecase'
import { TokenService } from './token.service'
import { ValidateJWTUsecase } from './verify-jwt.usecase'

@Module({
  imports: [ConfigModule],
  providers: [
    RedisProvider,
    RedisClient,
    TokenService,
    ValidateJWTUsecase,
    GetAccessTokenUsecase,
    DateService
  ],
  exports: [
    RedisProvider,
    TokenService,
    ValidateJWTUsecase,
    GetAccessTokenUsecase
  ]
})
export class TokenModule {}
