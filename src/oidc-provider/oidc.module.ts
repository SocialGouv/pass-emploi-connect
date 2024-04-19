import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TokenModule } from '../token/token.module'
import { OidcController } from './oidc.controller'
import { OidcService } from './oidc.service'
import { OidcProviderModuleProvider } from './provider'

@Module({
  imports: [ConfigModule, TokenModule],
  providers: [OidcService, OidcProviderModuleProvider],
  exports: [OidcService],
  controllers: [OidcController]
})
export class OidcModule {}
