import { Module } from '@nestjs/common'

import { FrancetravailJeuneService } from './francetravail-jeune.service'
import { FrancetravailJeuneController } from './francetravail-jeune.controller'
import { ConfigModule } from '@nestjs/config'
import { Context } from '../../context'
import { OidcService } from '../../oidc-provider/oidc.service'
import { OidcProviderModuleProvider } from '../../oidc-provider/provider'
import { RedisProvider } from '../../infrastructure/redis/redis.provider'
import { TokenExchangeGrant } from '../../oidc-provider/token-exchange.grant'
import { TokenService } from '../../infrastructure/services/token.service'
import { RedisClient } from '../../infrastructure/redis/redis.client'

@Module({
  imports: [ConfigModule],
  providers: [
    FrancetravailJeuneService,
    Context,
    OidcService,
    OidcProviderModuleProvider,
    RedisProvider,
    RedisClient,
    TokenService,
    TokenExchangeGrant
  ],
  controllers: [FrancetravailJeuneController]
})
export class FrancetravailJeuneModule {}
