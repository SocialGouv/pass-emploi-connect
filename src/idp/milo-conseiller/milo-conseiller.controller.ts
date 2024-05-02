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
import { MiloConseillerService } from './milo-conseiller.service'
import { Request, Response } from 'express'
import { OidcService } from '../../oidc-provider/oidc.service'
import { InteractionResults } from 'oidc-provider'
import { User } from '../../domain/user'
import { Account } from '../../domain/account'

@Controller(['milo-conseiller', 'auth/realms/pass-emploi'])
export class MiloConseillerController {
  private logger

  constructor(
    private readonly miloConseillerService: MiloConseillerService,
    private readonly oidcProvider: OidcService
  ) {
    this.logger = new Logger('MiloConseillerController')
  }

  @Get('connect/:interactionId')
  @Redirect('blank', HttpStatus.TEMPORARY_REDIRECT)
  async connect(
    @Param('interactionId') interactionId: string
    // @Res({ passthrough: true }) response: Response
  ): Promise<{ url: string }> {
    const authorizationUrl =
      await this.miloConseillerService.getAuthorizationUrl(interactionId)

    // response.cookie('nonce', interactionId)

    return {
      url: authorizationUrl
    }
  }

  @Get(['callback', 'broker/similo-conseiller/endpoint'])
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

    const { tokenSet, userInfo } = await this.miloConseillerService.callback(
      request,
      interactionDetails.uid
    )

    const accountId = Account.fromUserAccountToAccountId({
      sub: userInfo.sub,
      type: User.Type.CONSEILLER,
      structure: User.Structure.POLE_EMPLOI
    })

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
      grant = this.oidcProvider.createGrant(accountId)
    }

    grant!.addOIDCScope('openid')
    grant!.addOIDCScope('profile')
    grant!.addOIDCScope('email')
    grant!.addResourceScope(
      'https://api.pass-emploi.incubateur.net',
      'openid email profile'
    )
    // grant!.addOIDCClaims([
    //   'email',
    //   'userId',
    //   'userRoles',
    //   'userStructure',
    //   'userType',
    //   'family_name',
    //   'given_name'
    // ])

    const newGrantId = await grant!.save()
    this.logger.debug('newGrantId: %s', newGrantId)

    this.logger.log('#### USER INFO %j', userInfo)

    const result: InteractionResults = {
      login: { accountId },
      consent: { grantId: newGrantId },
      userType: User.Type.CONSEILLER,
      userStructure: User.Structure.MILO,
      email: userInfo.email,
      family_name: userInfo.family_name,
      given_name: userInfo.given_name
    }

    // TODO PUT Utilisateur

    this.logger.debug('interaction finished ?')
    await this.oidcProvider.interactionFinished(request, response, result)
    this.logger.debug('interaction finished yes')
  }
}
