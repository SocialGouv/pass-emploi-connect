import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TokenModule } from '../token/token.module'
import { OidcController } from './oidc.controller'
import { OidcService } from './oidc.service'
import { OidcProviderModuleProvider } from './provider'
import { TokenExchangeGrant } from './token-exchange.grant'
import { PassEmploiAPIModule } from '../pass-emploi-api/pass-emploi-api.module'

@Module({
  imports: [ConfigModule, TokenModule, PassEmploiAPIModule],
  providers: [OidcService, OidcProviderModuleProvider, TokenExchangeGrant],
  exports: [OidcService, TokenExchangeGrant],
  controllers: [OidcController]
})
export class OidcModule {}
