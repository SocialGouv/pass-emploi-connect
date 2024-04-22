import { Inject, Injectable, Logger } from '@nestjs/common'
import { KoaContextWithOIDC } from 'oidc-provider'
import { User, UserAccount } from '../domain/user'
import { GetAccessTokenUsecase } from '../token/get-access-token.usecase'
import { JWTService } from '../token/jwt.service'
import { OIDC_PROVIDER_MODULE, OidcProviderModule } from './provider'

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

  constructor(
    @Inject(OIDC_PROVIDER_MODULE) private readonly opm: OidcProviderModule,
    private readonly jwtService: JWTService,
    private readonly getAccessTokenUsecase: GetAccessTokenUsecase
  ) {
    this.logger = new Logger('TokenExchangeGrant')
  }

  // This approach has the advantage of not creating a new function instance on each call to TokenExchangeGrant.handler, since this will be called a lot, you might want to go with this version to minimize memory allocations.
  handler = async (
    context: KoaContextWithOIDC,
    next: () => Promise<void>
  ): Promise<void> => {
    // Vérifier les paramètres d'input
    // Vérifie que les paramètre d'input correspondent bien au cas qu'on a implemnté
    // Vérifie que subject_token_type est access_token

    // Vérifie que l'acces token en entrée est valide + permissions à faire le token exchange

    // Vérifier la validité de l'accessToken

    // Verif JWT : tester d'utiliser this.oidc.

    //const publicKey = await importJWK(context.oidc.client?.jwks?.keys[0]!, alg)
    try {
      const subjectToken = context.oidc.params?.subject_token as string
      const result = await this.jwtService.verifyTokenAndGetJwt(subjectToken)
      this.logger.debug('jwt verify %j', result)
    } catch (e) {
      this.logger.debug(e)
    }

    // if (!subjectToken) {
    //   const message = 'subject token not found'
    //   this.logger.warn(message)
    //   throw new this.opm.errors.InvalidGrant(message)
    // }
    // if (subjectToken.isExpired) {
    //   const message = 'subject token is expired'
    //   this.logger.warn(message)
    //   throw new this.opm.errors.InvalidGrant(message)
    // }

    const userAccount: UserAccount = {
      sub: 'TNAN0480',
      type: User.Type.CONSEILLER,
      structure: User.Structure.POLE_EMPLOI
    }

    // token usecase getAccessToken
    const tokenData = await this.getAccessTokenUsecase.execute({ userAccount })

    if (!tokenData) {
      const message = 'unable to find an access_token'
      this.logger.warn(message)
      throw new this.opm.errors.InvalidTarget(message)
    }

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

    context.body = {
      issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      access_token: tokenData.token,
      token_type: 'bearer',
      expires_in: tokenData.expiresIn,
      scope: tokenData.scope
    }

    this.logger.debug('End token exchange Grant')

    await next()
  }
}
