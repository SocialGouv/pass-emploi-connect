import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { APIModule } from '../../api/api.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { ConseilDepartementalConseillerController } from './conseildepartemental-conseiller.controller'
import { ConseilDepartementalConseillerService } from './conseildepartemental-conseiller.service'

@Module({
  imports: [ConfigModule, OidcModule, TokenModule, APIModule],
  providers: [ConseilDepartementalConseillerService],
  exports: [],
  controllers: [ConseilDepartementalConseillerController]
})
export class ConseilDepartementalConseillerModule {}
