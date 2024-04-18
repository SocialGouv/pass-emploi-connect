import {
  CanBePromise,
  KoaContextWithOIDC,
  errors as oidcErrors
} from 'oidc-provider'

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

export type TokenExchangeHandler = (
  ctx: KoaContextWithOIDC,
  next: () => Promise<void>
) => CanBePromise<void>

export const handler: TokenExchangeHandler =
  async function tokenExchangeHandler(ctx, next) {
    // Vérifier les paramètres d'input
    // Vérifier la validité de l'accessToken

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
      access_token: 'un-access-token',
      token_type: 'bearer',
      expires_in: 3600,

      scope: 'api:milo'
    }

    await next()
  }
