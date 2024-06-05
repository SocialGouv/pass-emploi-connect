import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { ContextStorageModule } from '../../context-storage/context-storage.module'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { MiloJeuneController } from './milo-jeune.controller'
import { MiloJeuneService } from './milo-jeune.service'
import { APIModule } from '../../api/api.module'

@Module({
  imports: [
    ConfigModule,
    ContextStorageModule,
    OidcModule,
    TokenModule,
    APIModule
  ],
  providers: [MiloJeuneService],
  exports: [],
  controllers: [MiloJeuneController]
})
export class MiloJeuneModule {}
