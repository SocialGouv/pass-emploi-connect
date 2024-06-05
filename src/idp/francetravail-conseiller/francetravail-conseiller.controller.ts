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
import { handleResult } from '../../result/result.handler'
import { FrancetravailConseillerAIJService } from './francetravail-conseiller-aij.service'
import { FrancetravailConseillerBRSAService } from './francetravail-conseiller-brsa.service'
import { FrancetravailConseillerCEJService } from './francetravail-conseiller-cej.service'
import { User } from '../../domain/user'

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
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<unknown> {
    const ftType = request.query.state
    let result
    switch (ftType) {
      case 'aij':
        result = await this.francetravailConseillerAIJService.callback(
          request,
          response
        )
        return handleResult(
          result,
          User.Type.CONSEILLER,
          User.Structure.POLE_EMPLOI_AIJ
        )
      case 'brsa':
        result = await this.francetravailConseillerBRSAService.callback(
          request,
          response
        )
        return handleResult(
          result,
          User.Type.CONSEILLER,
          User.Structure.POLE_EMPLOI_BRSA
        )
      default:
        result = await this.francetravailConseillerCEJService.callback(
          request,
          response
        )
        return handleResult(
          result,
          User.Type.CONSEILLER,
          User.Structure.POLE_EMPLOI
        )
    }
  }
}
