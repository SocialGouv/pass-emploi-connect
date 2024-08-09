import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import configuration from './config/configuration'
import { FrancetravailConseillerModule } from './idp/francetravail-conseiller/francetravail-conseiller.module'
import { FrancetravailJeuneModule } from './idp/francetravail-jeune/francetravail-jeune.module'
import { MiloConseillerModule } from './idp/milo-conseiller/milo-conseiller.module'
import { MiloJeuneModule } from './idp/milo-jeune/milo-jeune.module'
import { configureLoggerModule } from './utils/monitoring/logger.module'
import { TerminusModule } from '@nestjs/terminus'
import { AccountModule } from './account/account.module'
import { ConseillerDeptModule } from './idp/conseiller-dept/conseiller-dept.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.environment',
      cache: true,
      load: [configuration]
    }),
    TerminusModule,
    configureLoggerModule(),
    FrancetravailJeuneModule,
    FrancetravailConseillerModule,
    MiloConseillerModule,
    MiloJeuneModule,
    ConseillerDeptModule,
    AccountModule
  ],
  controllers: [AppController]
})
export class AppModule {}
