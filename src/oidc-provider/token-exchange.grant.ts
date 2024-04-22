import { Inject, Injectable, Logger } from '@nestjs/common'
import { KoaContextWithOIDC } from 'oidc-provider'
import { User, UserAccount } from '../domain/user'
import { GetAccessTokenUsecase } from '../token/get-access-token.usecase'
import { ValidateJWTUsecase } from '../token/verify-jwt.usecase'
import { OIDC_PROVIDER_MODULE, OidcProviderModule } from './provider'
import { Account } from '../domain/account'

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
    private readonly validateJWTUsecase: ValidateJWTUsecase,
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
    const subjectToken = context.oidc.params?.subject_token as string
    if (!subjectToken) {
      const message = 'subject token not found'
      this.logger.warn(message)
      throw new this.opm.errors.InvalidGrant(message)
    }

    // Vérifie que l'input est un access token valide
    // faut-il vérifier les permissions à faire le token exchange ?
    let tokenPayload
    // TODO passer par une erreur métier
    try {
      tokenPayload = await this.validateJWTUsecase.execute({
        token: subjectToken
      })
    } catch (e) {
      const message = 'subject token is invalid'
      this.logger.warn(message)
      throw new this.opm.errors.InvalidGrant(message)
    }

    const userAccount: UserAccount = {
      sub: Account.getSubFromAccountId(tokenPayload.sub!),
      type: tokenPayload.userType! as User.Type,
      structure: tokenPayload.userStructure! as User.Structure
    }
    const tokenData = await this.getAccessTokenUsecase.execute({ userAccount })

    if (!tokenData) {
      const message = 'unable to find an access_token'
      this.logger.warn(message)
      throw new this.opm.errors.InvalidTarget(message)
    }

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
