import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { Logger } from 'nestjs-pino'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const logger = app.get(Logger)
  app.useLogger(logger)

  const appConfig = app.get(ConfigService)

  const corsAllowedOrigins = appConfig.get('cors.allowedOrigins')
  if (corsAllowedOrigins && corsAllowedOrigins.length > 0) {
    app.enableCors({ 
      origin: corsAllowedOrigins,
      maxAge: 86400,
    })
  } else {
    logger.warn('No CORS domain configured so CORS is disabled.')
  }
  
  const port = appConfig.get('port')
  await app.listen(port)
}
bootstrap()
