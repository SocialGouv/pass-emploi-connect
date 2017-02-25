import { Module } from '@nestjs/common'

import { MiloConseillerService } from './milo-conseiller.service'
import { MiloConseillerController } from './milo-conseiller.controller'
import { ConfigModule } from '@nestjs/config'
import { Context } from '../../context'
import { OidcService } from '../../oidc-provider/oidc.service'
import { OidcProviderModuleProvider } from '../../oidc-provider/provider'
import { RedisProvider } from '../../infrastructure/redis/redis.provider'

@Module({
  imports: [ConfigModule],
  providers: [
    MiloConseillerService,
    Context,
    OidcService,
    OidcProviderModuleProvider,
    RedisProvider
  ],
  controllers: [MiloConseillerController]
})
export class MiloConseillerModule {}
