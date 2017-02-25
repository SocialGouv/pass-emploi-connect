import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule
} from '@nestjs/swagger'

export function useSwagger(
  appConfig: ConfigService,
  app: NestExpressApplication
): void {
  const baserUrl = appConfig.get('baseUrl')

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pass Emploi OIDC')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      oauth2RedirectUrl: `${baserUrl}/documentation/oauth2-redirect.html`
    }
  }
  SwaggerModule.setup('documentation', app, document, customOptions)
}
