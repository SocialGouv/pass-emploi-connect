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
    @Res({ passthrough: true }) response: Response,
    @Param('interactionId') interactionId: string,
    @Query() ftQueryParams: { type: string }
  ): Promise<{ url: string } | void> {
    let authorizationUrlResult
    let structure: User.Structure

    switch (ftQueryParams.type) {
      case 'aij':
        structure = User.Structure.POLE_EMPLOI_AIJ
        authorizationUrlResult =
          this.francetravailConseillerAIJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      case 'brsa':
        structure = User.Structure.POLE_EMPLOI_BRSA
        authorizationUrlResult =
          this.francetravailConseillerBRSAService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      case 'cej':
      default:
        structure = User.Structure.POLE_EMPLOI_CEJ
        authorizationUrlResult =
          this.francetravailConseillerCEJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
    }

    if (isFailure(authorizationUrlResult))
      return redirectFailure(
        response,
        authorizationUrlResult,
        User.Type.CONSEILLER,
        structure
      )

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
    let structure: User.Structure

    switch (ftType) {
      case 'aij':
        structure = User.Structure.POLE_EMPLOI_AIJ
        result = await this.francetravailConseillerAIJService.callback(
          request,
          response
        )
        break
      case 'brsa':
        structure = User.Structure.POLE_EMPLOI_BRSA
        result = await this.francetravailConseillerBRSAService.callback(
          request,
          response
        )
        break
      case 'cej':
      default:
        structure = User.Structure.POLE_EMPLOI_CEJ
        result = await this.francetravailConseillerCEJService.callback(
          request,
          response
        )
        break
    }
    if (isFailure(result))
      return redirectFailure(response, result, User.Type.CONSEILLER, structure)
  }
}
