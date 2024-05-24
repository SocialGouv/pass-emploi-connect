import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Redirect,
  Render,
  Req,
  Res
} from '@nestjs/common'
import { Request, Response } from 'express'
import { MiloJeuneService } from './milo-jeune.service'
import { handleResult } from '../../result/result.handler'

@Controller()
export class MiloJeuneController {
  private readonly logger: Logger

  constructor(private readonly miloJeuneService: MiloJeuneService) {
    this.logger = new Logger('MiloJeuneController')
  }

  @Get('milo-jeune/connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Param('interactionId') interactionId: string
  ): Promise<{ url: string }> {
    const authorizationUrl =
      await this.miloJeuneService.getAuthorizationUrl(interactionId)
    return {
      url: authorizationUrl
    }
  }

  @Get('auth/realms/pass-emploi/broker/similo-jeune/endpoint')
  @Render('index')
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    const result = await this.miloJeuneService.callback(request, response)
    return handleResult(result)
  }
}
