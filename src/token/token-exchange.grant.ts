import { KoaContextWithOIDC, errors as oidcErrors } from 'oidc-provider'
import { TokenService } from './token.service'
import { Injectable, Logger } from '@nestjs/common'
import { User, UserAccount } from '../domain/user'

export const gty = 'token_exchange'
export const grantType = 'urn:ietf:params:oauth:grant-type:token-exchange'
export const parameters = new Set([
  'resource', // optional : uri of the resource to which the token should be issued

  'requested_token_type', // optional

  'subject_token', // required : the sub of the token to be exchanged
  'subject_token_type', // required : urn:ietf:params:oauth:token-type:access_token

  // Probablement inutile :
  'audience', // optional
  'scope', // optional :
  'actor_token', // optional : probablement inutile
  'actor_token_type' // optional : probablement inutile
])

@Injectable()
export class TokenExchangeGrant {
  private logger: Logger

  constructor(private readonly tokenService: TokenService) {
    this.logger = new Logger('TokenExchangeGrant')
  }

  // This approach has the advantage of not creating a new function instance on each call to TokenExchangeGrant.handler, since this will be called a lot, you might want to go with this version to minimize memory allocations.
  handler = async (
    ctx: KoaContextWithOIDC,
    next: () => Promise<void>
  ): Promise<void> => {
    // Vérifier les paramètres d'input
    // Vérifier la validité de l'accessToken

    //this.logger.debug('Begin token exchange Grant')

    const userAccount: UserAccount = {
      sub: 'TNAN0480',
      type: User.Type.CONSEILLER,
      structure: User.Structure.POLE_EMPLOI
    }

    const { token } = await this.tokenService.getToken(
      userAccount,
      'access_token'
    )

    // const conf = ctx.oidc.provider

    // const { RefreshToken, Account, AccessToken, IdToken, ReplayDetection } =
    //   ctx.oidc.provider
    // const { client } = ctx.oidc

    // const dPoP = await dpopValidate(ctx)

    // let refreshTokenValue = ctx.oidc.params?.refresh_token as string
    // let refreshToken = await RefreshToken.find(refreshTokenValue, {
    //   ignoreExpiration: true
    // })

    // if (!refreshToken) {
    //   throw new oidcErrors.InvalidGrant('refresh token not found')
    // }

    // if (refreshToken.clientId !== client.clientId) {
    //   throw new oidcErrors.InvalidGrant('client mismatch')
    // }

    // if (refreshToken.isExpired) {
    //   throw new oidcErrors.InvalidGrant('refresh token is expired')
    // }

    ctx.body = {
      issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      access_token: token,
      token_type: 'bearer',
      expires_in: 3600,

      scope: 'api:milo'
    }

    this.logger.debug('End token exchange Grant')

    await next()
  }
}
