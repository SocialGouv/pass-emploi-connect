import { Module } from '@nestjs/common'

import { FrancetravailConseillerService } from './francetravail-conseiller.service'
import { FrancetravailConseillerController } from './francetravail-conseiller.controller'
import { ConfigModule } from '@nestjs/config'
import { Context } from '../../context'
import { OidcService } from '../../oidc-provider/oidc.service'
import { OidcProviderModuleProvider } from '../../oidc-provider/provider'
import { RedisProvider } from '../../infrastructure/redis/redis.provider'

@Module({
  imports: [ConfigModule],
  providers: [
    FrancetravailConseillerService,
    Context,
    OidcService,
    OidcProviderModuleProvider,
    RedisProvider
  ],
  controllers: [FrancetravailConseillerController]
})
export class FrancetravailConseillerModule {}
