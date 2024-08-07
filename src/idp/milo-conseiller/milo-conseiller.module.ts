import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { APIModule } from '../../api/api.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { MiloConseillerController } from './milo-conseiller.controller'
import { MiloConseillerService } from './milo-conseiller.service'

@Module({
  imports: [ConfigModule, OidcModule, TokenModule, APIModule],
  providers: [MiloConseillerService],
  exports: [],
  controllers: [MiloConseillerController]
})
export class MiloConseillerModule {}
