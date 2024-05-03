import { Controller, All, Req, Res, Logger } from '@nestjs/common'
import { Request, Response } from 'express'
import { OidcService } from './oidc.service'

@Controller('auth/realms/pass-emploi')
export class OidcController {
  private callback: (req: Request, res: Response) => Promise<void>
  private logger

  constructor(private readonly oidcService: OidcService) {
    this.callback = this.oidcService.callback()
    this.logger = new Logger('OidcController')
  }

  @All([
    '.well-known/openid-configuration',
    'protocol/openid-connect/*',
    'clients-registrations/*'
  ])
  public mountedOidc(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      this.logger.debug('BONJOUR')
      req.url = req.originalUrl.replace('/auth/realms/pass-emploi', '')
      return this.callback(req, res)
    } catch (e) {
      this.logger.error(e)
      throw e
    }
  }
}
