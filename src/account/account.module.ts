import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { RedisClient } from '../redis/redis.client'
import { DateService } from '../utils/date.service'
import { DeleteAccountUsecase } from './delete-account.usecase'
import { RedisProvider } from '../redis/redis.provider'

@Module({
  imports: [ConfigModule],
  providers: [DeleteAccountUsecase, DateService, RedisProvider, RedisClient],
  exports: [DeleteAccountUsecase]
})
export class AccountModule {}
