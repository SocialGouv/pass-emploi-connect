import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import configuration from './config/configuration'
import { RedisProvider } from './infrastructure/redis/redis.provider'
import { RedisClient } from './infrastructure/redis/redis.client'
import { configureLoggerModule } from './logger.module'
import { OidcController } from './oidc-provider/oidc.controller'
import { OidcService } from './oidc-provider/oidc.service'
import { OidcProviderModuleProvider } from './oidc-provider/provider'
import { FrancetravailJeuneModule } from './idp/francetravail-jeune/francetravail-jeune.module'
import { FrancetravailConseillerModule } from './idp/francetravail-conseiller/francetravail-conseiller.module'
import { MiloConseillerModule } from './idp/milo-conseiller/milo-conseiller.module'
import { TokenService } from './infrastructure/services/token.service'
import { TokenExchangeGrant } from './oidc-provider/token-exchange.grant'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.environment',
      cache: true,
      load: [configuration]
    }),
    configureLoggerModule(),
    HttpModule.register({
      timeout: 5000
    }),
    FrancetravailJeuneModule,
    FrancetravailConseillerModule,
    MiloConseillerModule
  ],
  controllers: [AppController, OidcController],
  providers: [
    RedisProvider,
    RedisClient,
    OidcProviderModuleProvider,
    OidcService,
    TokenService,
    TokenExchangeGrant
  ],
  exports: [RedisProvider, OidcProviderModuleProvider]
})
export class AppModule {}
