import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { APIModule } from '../../api/api.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { MiloJeuneController } from './milo-jeune.controller'
import { MiloJeuneService } from './milo-jeune.service'

@Module({
  imports: [ConfigModule, OidcModule, TokenModule, APIModule],
  providers: [MiloJeuneService],
  exports: [],
  controllers: [MiloJeuneController]
})
export class MiloJeuneModule {}
