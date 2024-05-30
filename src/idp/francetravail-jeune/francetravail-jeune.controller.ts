import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Query,
  Redirect,
  Render,
  Req,
  Res
} from '@nestjs/common'
import { Request, Response } from 'express'
import { FrancetravailJeuneCEJService } from './francetravail-jeune.service'
import { FrancetravailAIJService } from './francetravail-aij.service'
import { FrancetravailBRSAService } from './francetravail-brsa.service'
import { handleResult } from '../../result/result.handler'

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
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    const ftType = request.query.state
    let result

    switch (ftType) {
      case 'aij':
        result = await this.francetravailAIJService.callback(request, response)
        break
      case 'brsa':
        result = await this.francetravailBRSAService.callback(request, response)
        break
      default:
        result = await this.francetravailJeuneCEJService.callback(
          request,
          response
        )
        break
    }
    return handleResult(result)
  }
}
