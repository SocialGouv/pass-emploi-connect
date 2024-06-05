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
import { handleResult } from '../../result/result.handler'
import { MiloConseillerService } from './milo-conseiller.service'
import { User } from '../../domain/user'

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
      this.miloConseillerService.getAuthorizationUrl(interactionId)
    return {
      url: authorizationUrl
    }
  }

  @Get('auth/realms/pass-emploi/broker/similo-conseiller/endpoint')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<unknown> {
    const result = await this.miloConseillerService.callback(request, response)
    return handleResult(result, User.Type.CONSEILLER, User.Structure.MILO)
  }
}
