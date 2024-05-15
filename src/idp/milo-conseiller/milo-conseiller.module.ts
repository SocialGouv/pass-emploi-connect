import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { MiloConseillerController } from './milo-conseiller.controller'
import { MiloConseillerService } from './milo-conseiller.service'
import { PassEmploiAPIModule } from '../../pass-emploi-api/pass-emploi-api.module'
import { ContextStorageModule } from '../../context-storage/context-storage.module'

@Module({
  imports: [
    ConfigModule,
    OidcModule,
    ContextStorageModule,
    TokenModule,
    PassEmploiAPIModule
  ],
  providers: [MiloConseillerService],
  exports: [],
  controllers: [MiloConseillerController]
})
export class MiloConseillerModule {}
