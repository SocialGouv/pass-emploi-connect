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
import { handleFailure } from '../../utils/result/result.handler'
import { FrancetravailAIJService } from './francetravail-aij.service'
import { FrancetravailBRSAService } from './francetravail-brsa.service'
import { FrancetravailJeuneCEJService } from './francetravail-jeune.service'
import { User } from '../../domain/user'
import { isFailure } from '../../utils/result/result'
const userType = User.Type.JEUNE

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
    let authorizationUrlResult
    let userStructure: User.Structure

    switch (ftQueryParams.type) {
      case 'aij':
        userStructure = User.Structure.POLE_EMPLOI_AIJ
        authorizationUrlResult =
          this.francetravailAIJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      case 'brsa':
        userStructure = User.Structure.POLE_EMPLOI_BRSA
        authorizationUrlResult =
          this.francetravailBRSAService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
        break
      default:
        userStructure = User.Structure.POLE_EMPLOI
        authorizationUrlResult =
          this.francetravailJeuneCEJService.getAuthorizationUrl(
            interactionId,
            ftQueryParams.type
          )
    }

    if (isFailure(authorizationUrlResult))
      return handleFailure(authorizationUrlResult, userType, userStructure)

    return {
      url: authorizationUrlResult.data
    }
  }

  @Get('auth/realms/pass-emploi/broker/pe-jeune/endpoint')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ url: string } | void> {
    const ftType = request.query.state
    let result
    let userStructure: User.Structure

    switch (ftType) {
      case 'aij':
        userStructure = User.Structure.POLE_EMPLOI_AIJ
        result = await this.francetravailAIJService.callback(request, response)
        break
      case 'brsa':
        userStructure = User.Structure.POLE_EMPLOI_BRSA
        result = await this.francetravailBRSAService.callback(request, response)
        break
      default:
        userStructure = User.Structure.POLE_EMPLOI
        result = await this.francetravailJeuneCEJService.callback(
          request,
          response
        )
        break
    }
    if (isFailure(result)) return handleFailure(result, userType, userStructure)
  }
}
