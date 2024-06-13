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
import { redirectFailure } from '../../utils/result/result.handler'
import { MiloJeuneService } from './milo-jeune.service'
import { User } from '../../domain/user'
import { isFailure } from '../../utils/result/result'

const userType = User.Type.JEUNE
const userStructure = User.Structure.MILO

@Controller()
export class MiloJeuneController {
  private readonly logger: Logger

  constructor(private readonly miloJeuneService: MiloJeuneService) {
    this.logger = new Logger('MiloJeuneController')
  }

  @Get('milo-jeune/connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Res({ passthrough: true }) response: Response,
    @Param('interactionId') interactionId: string
  ): Promise<{ url: string } | void> {
    const authorizationUrlResult =
      this.miloJeuneService.getAuthorizationUrl(interactionId)
    if (isFailure(authorizationUrlResult))
      return redirectFailure(
        response,
        authorizationUrlResult,
        userType,
        userStructure
      )
    return {
      url: authorizationUrlResult.data
    }
  }

  @Get('auth/realms/pass-emploi/broker/similo-jeune/endpoint')
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ url: string } | void> {
    const result = await this.miloJeuneService.callback(request, response)
    if (isFailure(result))
      return redirectFailure(response, result, userType, userStructure)
  }
}
