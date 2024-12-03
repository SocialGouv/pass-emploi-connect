import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { APIModule } from '../../api/api.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { FrancetravailConseillerAIJService } from './francetravail-conseiller-aij.service'
import { FrancetravailConseillerBRSAService } from './francetravail-conseiller-brsa.service'
import { FrancetravailConseillerCEJService } from './francetravail-conseiller-cej.service'
import { FrancetravailConseillerController } from './francetravail-conseiller.controller'
import { FrancetravailConseillerAvenirProService } from './francetravail-conseiller-avenirpro.service'

@Module({
  imports: [ConfigModule, OidcModule, TokenModule, APIModule],
  providers: [
    FrancetravailConseillerCEJService,
    FrancetravailConseillerAIJService,
    FrancetravailConseillerBRSAService,
    FrancetravailConseillerAvenirProService
  ],
  exports: [],
  controllers: [FrancetravailConseillerController]
})
export class FrancetravailConseillerModule {}
