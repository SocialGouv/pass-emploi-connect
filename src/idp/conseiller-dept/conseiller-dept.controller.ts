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
import { isFailure } from '../../utils/result/result'
import { redirectFailure } from '../../utils/result/result.handler'
import { ConseillerDeptService } from './conseiller-dept.service'

@Controller()
export class ConseillerDeptController {
  private readonly logger: Logger

  constructor(private readonly conseillerDeptService: ConseillerDeptService) {
    this.logger = new Logger('ConseillerDeptController')
  }

  @Get('conseiller-dept/connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Res({ passthrough: true }) response: Response,
    @Param('interactionId') interactionId: string
  ): Promise<{ url: string } | void> {
    const authorizationUrlResult =
      this.conseillerDeptService.getAuthorizationUrl(interactionId)
    if (isFailure(authorizationUrlResult))
      return redirectFailure(response, authorizationUrlResult)
    return {
      url: authorizationUrlResult.data
    }
  }

  @Get('auth/realms/pass-emploi/broker/conseiller-dept/endpoint')
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    const result = await this.conseillerDeptService.callback(request, response)
    if (isFailure(result)) return redirectFailure(response, result)
  }
}
