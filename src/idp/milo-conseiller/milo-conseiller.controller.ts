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
import { handleFailure } from '../../utils/result/result.handler'
import { MiloConseillerService } from './milo-conseiller.service'
import { User } from '../../domain/user'
import { isFailure } from '../../utils/result/result'

const userType = User.Type.CONSEILLER
const userStructure = User.Structure.MILO

@Controller()
export class MiloConseillerController {
  private readonly logger: Logger

  constructor(private readonly miloConseillerService: MiloConseillerService) {
    this.logger = new Logger('MiloConseillerController')
  }

  @Get('milo-conseiller/connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Param('interactionId') interactionId: string
  ): Promise<{ url: string }> {
    const authorizationUrlResult =
      this.miloConseillerService.getAuthorizationUrl(interactionId)
    if (isFailure(authorizationUrlResult))
      return handleFailure(authorizationUrlResult, userType, userStructure)
    return {
      url: authorizationUrlResult.data
    }
  }

  @Get('auth/realms/pass-emploi/broker/similo-conseiller/endpoint')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ url: string } | void> {
    const result = await this.miloConseillerService.callback(request, response)
    if (isFailure(result)) return handleFailure(result, userType, userStructure)
  }
}
