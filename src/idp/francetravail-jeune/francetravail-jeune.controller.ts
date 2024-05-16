import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Query,
  Redirect,
  Req,
  Res
} from '@nestjs/common'
import { Request, Response } from 'express'
import { FrancetravailJeuneCEJService } from './francetravail-jeune.service'
import { FrancetravailAIJService } from './francetravail-aij.service'
import { FrancetravailBRSAService } from './francetravail-brsa.service'

@Controller()
export class FrancetravailJeuneController {
  private readonly logger: Logger

  constructor(
    private readonly francetravailJeuneCEJService: FrancetravailJeuneCEJService,
    private readonly francetravailAIJService: FrancetravailAIJService,
    private readonly francetravailBRSAService: FrancetravailBRSAService
  ) {
    this.logger = new Logger('FrancetravailJeuneController')
  }

  @Get('francetravail-jeune/connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Param('interactionId') interactionId: string,
    @Query() ftQueryParams: { type: 'cej' | 'brsa' | 'aij' }
  ): Promise<{ url: string }> {
    let authorizationUrl

    switch (ftQueryParams.type) {
      case 'aij':
        authorizationUrl = this.francetravailAIJService.getAuthorizationUrl(
          interactionId,
          ftQueryParams.type
        )
        break
      case 'brsa':
        authorizationUrl = this.francetravailBRSAService.getAuthorizationUrl(
          interactionId,
          ftQueryParams.type
        )
        break
      default:
        authorizationUrl =
          this.francetravailJeuneCEJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
    }

    return {
      url: authorizationUrl
    }
  }

  @Get('auth/realms/pass-emploi/broker/pe-jeune/endpoint')
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    const ftType = request.query.state

    switch (ftType) {
      case 'aij':
        await this.francetravailAIJService.callback(request, response)
        break
      case 'brsa':
        await this.francetravailBRSAService.callback(request, response)
        break
      default:
        await this.francetravailJeuneCEJService.callback(request, response)
        break
    }
  }
}
