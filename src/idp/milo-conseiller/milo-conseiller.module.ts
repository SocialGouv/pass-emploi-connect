import { Module } from '@nestjs/common'

import { MiloConseillerService } from './milo-conseiller.service'
import { MiloConseillerController } from './milo-conseiller.controller'
import { ConfigModule } from '@nestjs/config'
import { Context } from '../../context'
import { OidcService } from '../../oidc-provider/oidc.service'
import { OidcProviderModuleProvider } from '../../oidc-provider/provider'
import { RedisProvider } from '../../infrastructure/redis/redis.provider'
import { RedisClient } from '../../infrastructure/redis/redis.client'
import { TokenService } from '../../infrastructure/services/token.service'
import { TokenExchangeGrant } from '../../oidc-provider/token-exchange.grant'

@Module({
  imports: [ConfigModule],
  providers: [
    MiloConseillerService,
    Context,
    OidcService,
    OidcProviderModuleProvider,
    RedisProvider,
    TokenService,
    RedisClient,
    TokenService,
    TokenExchangeGrant
  ],
  controllers: [MiloConseillerController]
})
export class MiloConseillerModule {}
