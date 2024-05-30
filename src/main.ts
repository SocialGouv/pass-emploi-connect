import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

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

  const port = appConfig.get('port')
  await app.listen(port, '0.0.0.0')
}
bootstrap()
