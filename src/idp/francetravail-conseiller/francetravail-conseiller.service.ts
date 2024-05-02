import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'
import { BaseClient, Issuer, TokenSet } from 'openid-client'
import { Account } from '../../domain/account'
import { User, UserAccount } from '../../domain/user'
import { OidcService } from '../../oidc-provider/oidc.service'
import { ClientAuthMethod, InteractionResults } from 'oidc-provider'
import { generateNewGrantId } from '../utils'
import { TokenService } from '../../token/token.service'
import { Context, ContextKey } from '../../context/context.provider'
import { PassEmploiAPIService } from '../../pass-emploi-api/pass-emploi-api.service'

@Injectable()
export class FrancetravailConseillerService {
  private readonly logger: Logger
  private readonly ACCESS_TOKEN_DEFAULT_EXPIRES_IN: number
  private readonly REFRESH_TOKEN_DEFAULT_EXPIRES_IN: number

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
    private readonly tokenService: TokenService,
    private readonly context: Context,
    private readonly passemploiapi: PassEmploiAPIService
  ) {
    this.logger = new Logger('FrancetravailConseillerService')
    this.ACCESS_TOKEN_DEFAULT_EXPIRES_IN = this.configService.get<number>(
      'francetravailConseiller.accessTokenMaxAge'
    )!
    this.REFRESH_TOKEN_DEFAULT_EXPIRES_IN = this.configService.get<number>(
      'francetravailConseiller.accessTokenMaxAge'
    )!

    this.idp = this.configService.get('francetravailConseiller')!

    // discover possible sur cette URL en intra
    // /connexion/oauth2/.well-known/openid-configuration?realm=/agent
    const issuerConfig = {
      issuer: this.idp.issuer,
      authorization_endpoint: this.idp.authorizationUrl,
      token_endpoint: this.idp.tokenUrl,
      jwks_uri: this.idp.jwks,
      userinfo_endpoint: this.idp.userinfo
    }
    const clientConfig = {
      client_id: this.idp.clientId,
      client_secret: this.idp.clientSecret,
      redirect_uris: [this.idp.redirectUri],
      response_types: ['code'],
      scope: this.idp.scopes,
      token_endpoint_auth_method: 'client_secret_post' as ClientAuthMethod
    }
    this.context.set(
      ContextKey.FT_CONSEILLER_ISSUER,
      JSON.stringify(issuerConfig)
    )
    this.context.set(
      ContextKey.FT_CONSEILLER_CLIENT,
      JSON.stringify(clientConfig)
    )
    this.issuer = new Issuer(issuerConfig)
    this.client = new this.issuer.Client(clientConfig)
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
    const accountId = Account.fromUserAccountToAccountId(userAccount)

    this.tokenService.setToken(userAccount, 'access_token', {
      token: tokenSet.access_token!,
      expiresIn: tokenSet.expires_in ?? this.ACCESS_TOKEN_DEFAULT_EXPIRES_IN,
      scope: tokenSet.scope
    })
    if (tokenSet.refresh_token) {
      let refreshExpiresIn
      try {
        refreshExpiresIn = tokenSet.refresh_expires_in as number
      } catch (e) {}
      this.tokenService.setToken(userAccount, 'refresh_token', {
        token: tokenSet.refresh_token,
        expiresIn: refreshExpiresIn ?? this.REFRESH_TOKEN_DEFAULT_EXPIRES_IN,
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

    // TODO PUT Utilisateur
    const apiUser = await this.passemploiapi.putUser(userAccount.sub, {
      nom: userInfo.given_name,
      prenom: userInfo.family_name,
      email: userInfo.email,
      structure: userAccount.structure,
      type: userAccount.type
    })

    if (!apiUser) {
      this.logger.debug('could not put user')
      throw new Error('could not put user')
    }

    const result: InteractionResults = {
      login: { accountId },
      consent: { grantId: newGrantId },
      userType: User.Type.CONSEILLER,
      userStructure: User.Structure.POLE_EMPLOI,
      email: userInfo.email,
      family_name: userInfo.family_name,
      given_name: userInfo.given_name,
      userRoles: apiUser.userRoles,
      userId: apiUser.userId
    }

    await this.oidcService.interactionFinished(request, response, result)
  }
}
