import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import configuration from './config/configuration'
import { FrancetravailConseillerModule } from './idp/francetravail-conseiller/francetravail-conseiller.module'
import { FrancetravailJeuneModule } from './idp/francetravail-jeune/francetravail-jeune.module'
import { MiloConseillerModule } from './idp/milo-conseiller/milo-conseiller.module'
import { configureLoggerModule } from './logger.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.environment',
      cache: true,
      load: [configuration]
    }),
    configureLoggerModule(),
    FrancetravailJeuneModule,
    FrancetravailConseillerModule,
    MiloConseillerModule
  ],
  controllers: [AppController]
})
export class AppModule {}
