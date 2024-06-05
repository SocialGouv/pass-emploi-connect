import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { PassEmploiAPIClient } from './pass-emploi-api.client'
import { HttpModule } from '@nestjs/axios'
import { FrancetravailAPIClient } from './francetravail-api.client'

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 5000
    })
  ],
  providers: [PassEmploiAPIClient, FrancetravailAPIClient],
  exports: [PassEmploiAPIClient, FrancetravailAPIClient]
})
export class APIModule {}
