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
import { FrancetravailConseillerService } from './francetravail-conseiller.service'

@Controller(['francetravail-conseiller', 'auth/realms/pass-emploi'])
export class FrancetravailConseillerController {
  private readonly logger: Logger

  constructor(
    private readonly francetravailConseillerService: FrancetravailConseillerService
  ) {
    this.logger = new Logger('FrancetravailConseillerController')
  }

  @Get('connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Param('interactionId') interactionId: string
  ): Promise<{ url: string }> {
    const authorizationUrl =
      await this.francetravailConseillerService.getAuthorizationUrl(
        interactionId
      )
    return {
      url: authorizationUrl
    }
  }

  @Get(['callback', 'broker/pe-conseiller/endpoint'])
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    await this.francetravailConseillerService.callback(request, response)
  }
}
