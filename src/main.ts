import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { Logger } from 'nestjs-pino'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const logger = app.get(Logger)
  app.useLogger(logger)

  const appConfig = app.get<ConfigService>(ConfigService)
  const port = appConfig.get('port')
  await app.listen(port)
}
bootstrap()
