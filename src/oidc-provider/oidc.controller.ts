import { Controller, All, Req, Res, Logger } from '@nestjs/common'
import { Request, Response } from 'express'
import { OidcService } from './oidc.service'

@Controller('oidc')
export class OidcController {
  private callback: (req: Request, res: Response) => Promise<void>
  private logger

  constructor(private readonly oidcService: OidcService) {
    this.callback = this.oidcService.callback()
    this.logger = new Logger('OidcController')
  }

  @All('/*')
  public mountedOidc(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      this.logger.debug('BONJOUUUUUUUUUUUUUUUUUUUUUUUR')
      req.url = req.originalUrl.replace('/oidc', '')
      return this.callback(req, res)
    } catch (e) {
      this.logger.error(e)
      throw e
    }
  }
}
