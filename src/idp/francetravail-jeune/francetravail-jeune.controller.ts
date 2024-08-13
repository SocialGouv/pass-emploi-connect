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
import { FrancetravailAIJService } from './francetravail-aij.service'
import { FrancetravailBeneficiaireService } from './francetravail-beneficiaire.service'
import { FrancetravailBRSAService } from './francetravail-brsa.service'
import { FrancetravailJeuneCEJService } from './francetravail-jeune.service'
import { User } from '../../domain/user'

@Controller()
export class FrancetravailJeuneController {
  private readonly logger: Logger

  constructor(
    private readonly francetravailJeuneCEJService: FrancetravailJeuneCEJService,
    private readonly francetravailAIJService: FrancetravailAIJService,
    private readonly francetravailBRSAService: FrancetravailBRSAService,
    private readonly francetravailBeneficiaireService: FrancetravailBeneficiaireService
  ) {
    this.logger = new Logger('FrancetravailJeuneController')
  }

  @Get('francetravail-jeune/connect/:interactionId')
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
          this.francetravailAIJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      case 'brsa':
        authorizationUrlResult =
          this.francetravailBRSAService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      case 'cej':
        authorizationUrlResult =
          this.francetravailJeuneCEJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      case 'ft-beneficiaire':
      default:
        authorizationUrlResult =
          this.francetravailBeneficiaireService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
    }

    if (isFailure(authorizationUrlResult))
      return redirectFailure(response, authorizationUrlResult, User.Type.JEUNE)

    return {
      url: authorizationUrlResult.data
    }
  }

  @Get('auth/realms/pass-emploi/broker/pe-jeune/endpoint')
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ url: string } | void> {
    const ftType = request.query.state
    let result

    switch (ftType) {
      case 'aij':
        result = await this.francetravailAIJService.callback(request, response)
        break
      case 'brsa':
        result = await this.francetravailBRSAService.callback(request, response)
        break
      case 'cej':
        result = await this.francetravailJeuneCEJService.callback(
          request,
          response
        )
        break
      case 'ft-beneficiaire':
      default:
        result = await this.francetravailBeneficiaireService.callback(
          request,
          response
        )
        break
    }
    if (isFailure(result))
      return redirectFailure(response, result, User.Type.JEUNE)
  }
}
