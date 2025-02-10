import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { FrancetravailConseillerAccompagnementIntensifService } from 'src/idp/francetravail-conseiller/francetravail-conseiller-accompagnement-intensif.service'
import { FrancetravailConseillerAccompagnementGlobalService } from 'src/idp/francetravail-conseiller/francetravail-conseiller-accompagnement-global.service'
import { APIModule } from '../../api/api.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { FrancetravailConseillerAIJService } from './francetravail-conseiller-aij.service'
import { FrancetravailConseillerBRSAService } from './francetravail-conseiller-brsa.service'
import { FrancetravailConseillerCEJService } from './francetravail-conseiller-cej.service'
import { FrancetravailConseillerController } from './francetravail-conseiller.controller'
import { FrancetravailConseillerAvenirProService } from './francetravail-conseiller-avenirpro.service'
import { FrancetravailConseillerService } from './francetravail-conseiller.service'

@Module({
  imports: [ConfigModule, OidcModule, TokenModule, APIModule],
  providers: [
    FrancetravailConseillerService,
    FrancetravailConseillerCEJService,
    FrancetravailConseillerAIJService,
    FrancetravailConseillerBRSAService,
    FrancetravailConseillerAvenirProService,
    FrancetravailConseillerAccompagnementIntensifService,
    FrancetravailConseillerAccompagnementGlobalService
  ],
  exports: [],
  controllers: [FrancetravailConseillerController]
})
export class FrancetravailConseillerModule {}
