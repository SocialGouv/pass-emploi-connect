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
import { isFailure } from '../../utils/result/result'
import { redirectFailure } from '../../utils/result/result.handler'
import { FrancetravailConseillerAIJService } from './francetravail-conseiller-aij.service'
import { FrancetravailConseillerBRSAService } from './francetravail-conseiller-brsa.service'
import { FrancetravailConseillerCEJService } from './francetravail-conseiller-cej.service'

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
    @Res({ passthrough: true }) response: Response,
    @Param('interactionId') interactionId: string,
    @Query() ftQueryParams: { type: string }
  ): Promise<{ url: string } | void> {
    let authorizationUrlResult

    switch (ftQueryParams.type) {
      case 'aij':
        authorizationUrlResult =
          this.francetravailConseillerAIJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      case 'brsa':
        authorizationUrlResult =
          this.francetravailConseillerBRSAService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      case 'cej':
      default:
        authorizationUrlResult =
          this.francetravailConseillerCEJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
    }

    if (isFailure(authorizationUrlResult))
      return redirectFailure(response, authorizationUrlResult)

    return {
      url: authorizationUrlResult.data
    }
  }

  @Get('auth/realms/pass-emploi/broker/pe-conseiller/endpoint')
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ url: string } | void> {
    const ftType = request.query.state
    let result

    switch (ftType) {
      case 'aij':
        result = await this.francetravailConseillerAIJService.callback(
          request,
          response
        )
        break
      case 'brsa':
        result = await this.francetravailConseillerBRSAService.callback(
          request,
          response
        )
        break
      case 'cej':
      default:
        result = await this.francetravailConseillerCEJService.callback(
          request,
          response
        )
        break
    }
    if (isFailure(result)) return redirectFailure(response, result)
  }
}
