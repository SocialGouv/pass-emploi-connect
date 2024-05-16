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
import { FrancetravailConseillerCEJService } from './francetravail-conseiller-cej.service'
import { FrancetravailConseillerAIJService } from './francetravail-conseiller-aij.service'
import { FrancetravailConseillerBRSAService } from './francetravail-conseiller-brsa.service'

@Controller()
export class FrancetravailConseillerController {
  private readonly logger: Logger

  constructor(
    private readonly francetravailConseillerCEJService: FrancetravailConseillerCEJService,
    private readonly francetravailConseillerAIJService: FrancetravailConseillerAIJService,
    private readonly francetravailConseillerBRSAService: FrancetravailConseillerBRSAService
  ) {
    this.logger = new Logger('FrancetravailConseillerController')
  }

  @Get('francetravail-conseiller/connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Param('interactionId') interactionId: string,
    @Query() ftQueryParams: { type: 'cej' | 'brsa' | 'aij' }
  ): Promise<{ url: string }> {
    let authorizationUrl

    switch (ftQueryParams.type) {
      case 'aij':
        authorizationUrl =
          this.francetravailConseillerAIJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      case 'brsa':
        authorizationUrl =
          this.francetravailConseillerBRSAService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      default:
        authorizationUrl =
          this.francetravailConseillerCEJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
    }

    return {
      url: authorizationUrl
    }
  }

  @Get('auth/realms/pass-emploi/broker/pe-conseiller/endpoint')
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    const ftType = request.query.state

    switch (ftType) {
      case 'aij':
        await this.francetravailConseillerAIJService.callback(request, response)
        break
      case 'brsa':
        await this.francetravailConseillerBRSAService.callback(
          request,
          response
        )
        break
      default:
        await this.francetravailConseillerCEJService.callback(request, response)
        break
    }
  }
}
