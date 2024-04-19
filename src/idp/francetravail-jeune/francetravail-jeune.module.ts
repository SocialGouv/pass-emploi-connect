import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { OidcModule } from '../../oidc-provider/oidc.module'
import { TokenModule } from '../../token/token.module'
import { FrancetravailJeuneController } from './francetravail-jeune.controller'
import { FrancetravailJeuneService } from './francetravail-jeune.service'

@Module({
  imports: [ConfigModule, OidcModule, TokenModule],
  providers: [FrancetravailJeuneService],
  exports: [],
  controllers: [FrancetravailJeuneController]
})
export class FrancetravailJeuneModule {}
