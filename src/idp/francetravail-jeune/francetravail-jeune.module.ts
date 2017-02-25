import { Module } from '@nestjs/common'

import { FrancetravailJeuneService } from './francetravail-jeune.service'
import { FrancetravailJeuneController } from './francetravail-jeune.controller'
import { ConfigModule } from '@nestjs/config'
import { Context } from '../../context'
import { OidcService } from '../../oidc-provider/oidc.service'
import { OidcProviderModuleProvider } from '../../oidc-provider/provider'
import { RedisProvider } from '../../infrastructure/redis/redis.provider'

@Module({
  imports: [ConfigModule],
  providers: [
    FrancetravailJeuneService,
    Context,
    OidcService,
    OidcProviderModuleProvider,
    RedisProvider
  ],
  controllers: [FrancetravailJeuneController]
})
export class FrancetravailJeuneModule {}
