import { Module } from '@nestjs/common'

import { FrancetravailConseillerService } from './francetravail-conseiller.service'
import { FrancetravailConseillerController } from './francetravail-conseiller.controller'
import { ConfigModule } from '@nestjs/config'
import { Context } from '../../context'
import { OidcService } from '../../oidc-provider/oidc.service'
import { OidcProviderModuleProvider } from '../../oidc-provider/provider'
import { RedisProvider } from '../../infrastructure/redis/redis.provider'
import { TokenService } from '../../infrastructure/services/token.service'
import { RedisClient } from '../../infrastructure/redis/redis.client'
import { TokenExchangeGrant } from '../../oidc-provider/token-exchange.grant'

@Module({
  imports: [ConfigModule],
  providers: [
    FrancetravailConseillerService,
    Context,
    OidcService,
    OidcProviderModuleProvider,
    RedisProvider,
    TokenService,
    RedisClient,
    TokenExchangeGrant
  ],
  controllers: [FrancetravailConseillerController]
})
export class FrancetravailConseillerModule {}
