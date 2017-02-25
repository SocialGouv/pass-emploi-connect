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
import { FrancetravailJeuneService } from './francetravail-jeune.service'
import { Request, Response } from 'express'
import { OidcService } from '../../oidc-provider/oidc.service'
import { InteractionResults } from 'oidc-provider'

@Controller(['francetravail-jeune', 'auth/realms/pass-emploi'])
export class FrancetravailJeuneController {
  private logger

  constructor(
    private readonly francetravailJeuneService: FrancetravailJeuneService,
    private readonly oidcProvider: OidcService
  ) {
    this.logger = new Logger('FrancetravailJeuneController')
  }

  @Get('connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Param('interactionId') interactionId: string
    // @Res({ passthrough: true }) response: Response
  ): Promise<{ url: string }> {
    const authorizationUrl =
      await this.francetravailJeuneService.getAuthorizationUrl(interactionId)

    // response.cookie('nonce', interactionId)

    return {
      url: authorizationUrl
    }
  }

  @Get(['callback', 'broker/pe-jeune/endpoint'])
  //@Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async callback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<void> {
    const interactionDetails = await this.oidcProvider.interactionDetails(
      request,
      response
    )

    this.logger.debug('INTERACTION DETAILS: %j', interactionDetails)

    const { tokenSet, userInfo } =
      await this.francetravailJeuneService.callback(
        request,
        interactionDetails.uid
      )

    // if (details.missingOIDCScope) {
    //   grant.addOIDCScope(details.missingOIDCScope.join(' '))
    // }
    // if (details.missingOIDCClaims) {
    //   grant.addOIDCClaims(details.missingOIDCClaims)
    // }
    // if (details.missingResourceScopes) {
    //   for (const [indicator, scopes] of Object.entries(
    //     details.missingResourceScopes
    //   )) {
    //     grant.addResourceScope(indicator, scopes.join(' '))
    //   }
    // }

    const { grantId } = interactionDetails

    let grant
    if (grantId) {
      // we'll be modifying existing grant in existing session
      grant = await this.oidcProvider.findGrant(grantId)
    } else {
      // we're establishing a new grant
      grant = this.oidcProvider.createGrant(userInfo.sub)
    }

    grant!.addOIDCScope('openid')

    const newGrantId = await grant!.save()
    this.logger.debug('newGrantId: %s', newGrantId)

    const result: InteractionResults = {
      login: { accountId: userInfo.sub! },
      consent: { grantId: newGrantId }
    }

    this.logger.debug('interaction finished ?')
    await this.oidcProvider.interactionFinished(request, response, result)
    this.logger.debug('interaction finished yes')
  }
}
