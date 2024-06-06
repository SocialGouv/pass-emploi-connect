import { Controller, All, Req, Res, Logger } from '@nestjs/common'
import { Request, Response } from 'express'
import { OidcService } from './oidc.service'
import * as APM from 'elastic-apm-node'
import { getAPMInstance } from '../utils/monitoring/apm.init'

@Controller('auth/realms/pass-emploi')
export class OidcController {
  private callback: (req: Request, res: Response) => Promise<void>
  private logger
  protected apmService: APM.Agent

  constructor(private readonly oidcService: OidcService) {
    this.callback = this.oidcService.callback()
    this.logger = new Logger('OidcController')
    this.apmService = getAPMInstance()
  }

  @All([
    '.well-known/openid-configuration',
    'protocol/openid-connect/*',
    'clients-registrations/*'
  ])
  public mountedOidc(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      req.url = req.originalUrl.replace('/auth/realms/pass-emploi', '')
      return this.callback(req, res)
    } catch (e) {
      this.logger.error(e)
      this.apmService.captureError(e)
      throw e
    }
  }
}
