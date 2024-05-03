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
import { FrancetravailJeuneService } from './francetravail-jeune.service'

@Controller(['francetravail-jeune', 'auth/realms/pass-emploi'])
export class FrancetravailJeuneController {
  private readonly logger: Logger

  constructor(
    private readonly francetravailJeuneService: FrancetravailJeuneService
  ) {
    this.logger = new Logger('FrancetravailJeuneController')
  }

  @Get('connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Param('interactionId') interactionId: string
  ): Promise<{ url: string }> {
    const authorizationUrl =
      await this.francetravailJeuneService.getAuthorizationUrl(interactionId)
    return {
      url: authorizationUrl
    }
  }

  @Get(['callback', 'broker/pe-jeune/endpoint'])
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    await this.francetravailJeuneService.callback(request, response)
  }
}
