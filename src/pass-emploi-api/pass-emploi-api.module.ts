import { Module } from '@nestjs/common'

import { ConfigModule } from '@nestjs/config'
import { PassEmploiAPIService } from './pass-emploi-api.service'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 5000
    })
  ],
  providers: [PassEmploiAPIService],
  exports: [PassEmploiAPIService]
})
export class PassEmploiAPIModule {}
