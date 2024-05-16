import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { ContextStorageModule } from '../../context-storage/context-storage.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { PassEmploiAPIModule } from '../../pass-emploi-api/pass-emploi-api.module'
import { TokenModule } from '../../token/token.module'
import { FrancetravailConseillerController } from './francetravail-conseiller.controller'
import { FrancetravailConseillerCEJService } from './francetravail-conseiller-cej.service'
import { FrancetravailConseillerBRSAService } from './francetravail-conseiller-brsa.service'
import { FrancetravailConseillerAIJService } from './francetravail-conseiller-aij.service'

@Module({
  imports: [
    ConfigModule,
    ContextStorageModule,
    OidcModule,
    TokenModule,
    PassEmploiAPIModule
  ],
  providers: [
    FrancetravailConseillerCEJService,
    FrancetravailConseillerAIJService,
    FrancetravailConseillerBRSAService
  ],
  exports: [],
  controllers: [FrancetravailConseillerController]
})
export class FrancetravailConseillerModule {}
