import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { APIModule } from '../../api/api.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { FrancetravailAIJService } from './francetravail-aij.service'
import { FrancetravailBeneficiaireService } from './francetravail-beneficiaire.service'
import { FrancetravailBRSAService } from './francetravail-brsa.service'
import { FrancetravailJeuneController } from './francetravail-jeune.controller'
import { FrancetravailJeuneCEJService } from './francetravail-jeune.service'

@Module({
  imports: [ConfigModule, OidcModule, TokenModule, APIModule],
  providers: [
    FrancetravailJeuneCEJService,
    FrancetravailAIJService,
    FrancetravailBRSAService,
    FrancetravailBeneficiaireService
  ],
  exports: [],
  controllers: [FrancetravailJeuneController]
})
export class FrancetravailJeuneModule {}
