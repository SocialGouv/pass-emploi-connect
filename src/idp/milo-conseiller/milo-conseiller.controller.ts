import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Redirect,
  Req,
  Res
} from '@nestjs/common'
import { Request, Response } from 'express'
import { MiloConseillerService } from './milo-conseiller.service'

@Controller()
export class MiloConseillerController {
  private readonly logger: Logger

  constructor(private readonly miloConseillerService: MiloConseillerService) {
    this.logger = new Logger('MiloConseillerController')
  }

  @Get('milo-conseiller/connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Param('interactionId') interactionId: string
  ): Promise<{ url: string }> {
    const authorizationUrl =
      await this.miloConseillerService.getAuthorizationUrl(interactionId)
    return {
      url: authorizationUrl
    }
  }

  @Get('auth/realms/pass-emploi/broker/similo-conseiller/endpoint')
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    await this.miloConseillerService.callback(request, response)
  }
}
