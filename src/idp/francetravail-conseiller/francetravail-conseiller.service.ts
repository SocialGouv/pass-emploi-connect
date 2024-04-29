import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'
import { BaseClient, Issuer, TokenSet } from 'openid-client'
import { Account } from '../../domain/account'
import { User, UserAccount } from '../../domain/user'
import { OidcService } from '../../oidc-provider/oidc.service'
import { InteractionResults } from 'oidc-provider'
import { generateNewGrantId } from '../utils'
import { TokenService } from '../../token/token.service'

const ACCESS_TOKEN_DEFAULT_EXPIRES_IN = 3600
const REFRESH_TOKEN_DEFAULT_EXPIRES_IN = 3600 * 24 * 42

@Injectable()
export class FrancetravailConseillerService {
  private readonly logger: Logger
  private readonly idp: {
    issuer: string
    realm: string
    authorizationUrl: string
    tokenUrl: string
    jwks: string
    userinfo: string
    clientId: string
    clientSecret: string
    scopes: string
    redirectUri: string
  }
  private issuer: Issuer<BaseClient>
  private client: BaseClient

  constructor(
    private readonly configService: ConfigService,
    private readonly oidcService: OidcService,
    private readonly tokenService: TokenService
  ) {
    this.logger = new Logger('FrancetravailConseillerService')

    this.idp = this.configService.get('francetravailConseiller')!

    // discover possible sur cette URL en intra
    // /connexion/oauth2/.well-known/openid-configuration?realm=/agent
    this.issuer = new Issuer({
      issuer: this.idp.issuer,
      authorization_endpoint: this.idp.authorizationUrl,
      token_endpoint: this.idp.tokenUrl,
      jwks_uri: this.idp.jwks,
      userinfo_endpoint: this.idp.userinfo
    })
    this.client = new this.issuer.Client({
      client_id: this.idp.clientId,
      client_secret: this.idp.clientSecret,
      redirect_uris: [this.idp.redirectUri],
      response_types: ['code'],
      scope: this.idp.scopes,
      token_endpoint_auth_method: 'client_secret_post'
    })
  }

  async getAuthorizationUrl(interactionId: string): Promise<string> {
    const authorizationUrl = this.client.authorizationUrl({
      nonce: interactionId,
      realm: this.idp.realm,
      scope: this.idp.scopes
    })
    return authorizationUrl
  }

  async callback(request: Request, response: Response): Promise<void> {
    const interactionDetails = await this.oidcService.interactionDetails(
      request,
      response
    )
    const params = this.client.callbackParams(request)
    const tokenSet = await this.client.callback(this.idp.redirectUri, params, {
      nonce: interactionDetails.uid
    })

    const userInfo = await this.client.userinfo(tokenSet, {
      params: { realm: this.idp.realm }
    })

    const userAccount = {
      sub: userInfo.sub,
      type: User.Type.CONSEILLER,
      structure: User.Structure.POLE_EMPLOI
    }
    const accountId = Account.generateAccountId(userAccount)

    this.tokenService.setToken(userAccount, 'access_token', {
      token: tokenSet.access_token!,
      expiresIn: tokenSet.expires_in ?? ACCESS_TOKEN_DEFAULT_EXPIRES_IN,
      scope: tokenSet.scope
    })
    if (tokenSet.refresh_token) {
      let refreshExpiresIn
      try {
        refreshExpiresIn = tokenSet.refresh_expires_in as number
      } catch (e) {}
      this.tokenService.setToken(userAccount, 'refresh_token', {
        token: tokenSet.refresh_token,
        expiresIn: refreshExpiresIn ?? REFRESH_TOKEN_DEFAULT_EXPIRES_IN,
        scope: tokenSet.scope
      })
    }

    const { grantId } = interactionDetails
    const newGrantId = await generateNewGrantId(
      this.configService,
      this.oidcService,
      accountId,
      grantId
    )

    const result: InteractionResults = {
      login: { accountId },
      consent: { grantId: newGrantId },
      userType: User.Type.CONSEILLER,
      userStructure: User.Structure.POLE_EMPLOI,
      email: userInfo.email,
      family_name: userInfo.family_name,
      given_name: userInfo.given_name
    }

    // TODO PUT Utilisateur

    await this.oidcService.interactionFinished(request, response, result)
  }

  async refresh(userAccount: UserAccount): Promise<TokenSet> {
    const refreshToken = await this.tokenService.getToken(
      userAccount,
      'refresh_token'
    )

    if (!refreshToken) {
      throw Error("l'utilisateur n'est pas authentifié")
    }

    const tokenSet = await this.client.refresh(refreshToken.token)

    this.tokenService.setToken(userAccount, 'access_token', {
      token: tokenSet.access_token!,
      expiresIn: tokenSet.expires_in ?? REFRESH_TOKEN_DEFAULT_EXPIRES_IN,
      scope: tokenSet.scope
    })

    return tokenSet
  }
}
