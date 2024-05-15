import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { ContextStorageModule } from '../../context-storage/context-storage.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { FrancetravailConseillerController } from './francetravail-conseiller.controller'
import { FrancetravailConseillerService } from './francetravail-conseiller.service'
import { PassEmploiAPIModule } from '../../pass-emploi-api/pass-emploi-api.module'

@Module({
  imports: [
    ConfigModule,
    ContextStorageModule,
    OidcModule,
    TokenModule,
    PassEmploiAPIModule
  ],
  providers: [FrancetravailConseillerService],
  exports: [],
  controllers: [FrancetravailConseillerController]
})
export class FrancetravailConseillerModule {}
