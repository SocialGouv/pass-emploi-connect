import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { join } from 'path'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const logger = app.get(Logger)
  app.useLogger(logger)

  const appConfig = app.get(ConfigService)

  const corsAllowedOrigins = appConfig.get('cors.allowedOrigins')
  if (corsAllowedOrigins && corsAllowedOrigins.length > 0) {
    app.enableCors({
      origin: corsAllowedOrigins,
      maxAge: 86400
    })
  } else {
    logger.warn('No CORS domain configured so CORS is disabled.')
  }

  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs')

  const port = appConfig.get('port')
  await app.listen(port, '0.0.0.0')
}
bootstrap()
