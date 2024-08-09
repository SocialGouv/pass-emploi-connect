import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { APIModule } from '../../api/api.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { ConseillerDeptController } from './conseiller-dept.controller'
import { ConseillerDeptService } from './conseiller-dept.service'

@Module({
  imports: [ConfigModule, OidcModule, TokenModule, APIModule],
  providers: [ConseillerDeptService],
  exports: [],
  controllers: [ConseillerDeptController]
})
export class ConseillerDeptModule {}
