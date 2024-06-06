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
import { handleResult } from '../../utils/result/result.handler'
import { MiloJeuneService } from './milo-jeune.service'
import { User } from '../../domain/user'

@Controller()
export class MiloJeuneController {
  private readonly logger: Logger

  constructor(private readonly miloJeuneService: MiloJeuneService) {
    this.logger = new Logger('MiloJeuneController')
  }

  @Get('milo-jeune/connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Param('interactionId') interactionId: string
  ): Promise<{ url: string }> {
    const authorizationUrl =
      this.miloJeuneService.getAuthorizationUrl(interactionId)
    return {
      url: authorizationUrl
    }
  }

  @Get('auth/realms/pass-emploi/broker/similo-jeune/endpoint')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<unknown> {
    const result = await this.miloJeuneService.callback(request, response)
    return handleResult(result, User.Type.JEUNE, User.Structure.MILO)
  }
}
