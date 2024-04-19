import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { FrancetravailConseillerController } from './francetravail-conseiller.controller'
import { FrancetravailConseillerService } from './francetravail-conseiller.service'

@Module({
  imports: [ConfigModule, OidcModule, TokenModule],
  providers: [FrancetravailConseillerService],
  exports: [],
  controllers: [FrancetravailConseillerController]
})
export class FrancetravailConseillerModule {}
