import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { ContextStorageModule } from '../../context-storage/context-storage.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { FrancetravailJeuneController } from './francetravail-jeune.controller'
import { FrancetravailJeuneCEJService } from './francetravail-jeune.service'
import { PassEmploiAPIModule } from '../../pass-emploi-api/pass-emploi-api.module'
import { FrancetravailAIJService } from './francetravail-aij.service'
import { FrancetravailBRSAService } from './francetravail-brsa.service'

@Module({
  imports: [
    ConfigModule,
    ContextStorageModule,
    OidcModule,
    TokenModule,
    PassEmploiAPIModule
  ],
  providers: [
    FrancetravailJeuneCEJService,
    FrancetravailAIJService,
    FrancetravailBRSAService
  ],
  exports: [],
  controllers: [FrancetravailJeuneController]
})
export class FrancetravailJeuneModule {}
