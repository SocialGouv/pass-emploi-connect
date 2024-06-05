import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'
import { ClientAuthMethod, InteractionResults } from 'oidc-provider'
import { BaseClient, Issuer } from 'openid-client'
import { IdpConfig, getIdpConfigIdentifier } from '../../config/configuration'
import {
  ContextKeyType,
  ContextStorage
} from '../../context-storage/context-storage.provider'
import { Account } from '../../domain/account'
import { User } from '../../domain/user'
import { OidcService } from '../../oidc-provider/oidc.service'
import { PassEmploiAPIService } from '../../pass-emploi-api/pass-emploi-api.service'
import { Result, emptySuccess, isFailure } from '../../result/result'
import { TokenService } from '../../token/token.service'
import { generateNewGrantId } from './helpers'
import * as APM from 'elastic-apm-node'
import { getAPMInstance } from '../../apm.init'

export abstract class IdpService {
  private idpName: string
  protected logger: Logger
  private userType: User.Type
  private userStructure: User.Structure
  private idp: IdpConfig
  private client: BaseClient
  protected apmService: APM.Agent

  constructor(
    idpName: string,
    userType: User.Type,
    userStructure: User.Structure,
    private readonly contextStorage: ContextStorage,
    private readonly configService: ConfigService,
    private readonly oidcService: OidcService,
    private readonly tokenService: TokenService,
    private readonly passemploiapi: PassEmploiAPIService
  ) {
    this.logger = new Logger(idpName)
    this.apmService = getAPMInstance()
    this.idpName = idpName
    this.userType = userType
    this.userStructure = userStructure
    this.idp =
      this.configService.get('idps')[
        getIdpConfigIdentifier(userType, userStructure)
      ]!

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
    this.contextStorage.set(
      {
        userType,
        userStructure,
        key: ContextKeyType.ISSUER
      },
      JSON.stringify(issuerConfig)
    )
    this.contextStorage.set(
      {
        userType,
        userStructure,
        key: ContextKeyType.CLIENT
      },
      JSON.stringify(clientConfig)
    )
    const issuer = new Issuer(issuerConfig)
    this.client = new issuer.Client(clientConfig)
  }

  getAuthorizationUrl(interactionId: string, state?: string): string {
    return this.client.authorizationUrl({
      nonce: interactionId,
      realm: this.idp.realm,
      scope: this.idp.scopes,
      state
    })
  }

  async callback(request: Request, response: Response): Promise<Result> {
    const interactionDetails = await this.oidcService.interactionDetails(
      request,
      response
    )
    const params = this.client.callbackParams(request)
    const tokenSet = await this.client.callback(this.idp.redirectUri, params, {
      nonce: interactionDetails.uid,
      state: request.query.state ? (request.query.state as string) : undefined
    })

    const userInfo = await this.client.userinfo(tokenSet, {
      params: { realm: this.idp.realm }
    })

    const account = {
      sub: userInfo.sub,
      type: this.userType,
      structure: this.userStructure
    }
    const accountId = Account.fromAccountToAccountId(account)

    await this.tokenService.setToken(account, 'access_token', {
      token: tokenSet.access_token!,
      expiresIn: tokenSet.expires_in || this.idp.accessTokenMaxAge,
      scope: tokenSet.scope
    })
    if (tokenSet.refresh_token) {
      let refreshExpiresIn
      try {
        refreshExpiresIn = tokenSet.refresh_expires_in as number
      } catch (e) {}
      await this.tokenService.setToken(account, 'refresh_token', {
        token: tokenSet.refresh_token,
        expiresIn: refreshExpiresIn || this.idp.refreshTokenMaxAge,
        scope: tokenSet.scope
      })
    }

    const { grantId } = interactionDetails
    const newGrantId = await generateNewGrantId(
      this.configService,
      this.oidcService,
      accountId,
      interactionDetails.params.client_id as string,
      grantId
    )

    // besoin de persister le preferred_username parce que le get token n'a pas cette info dans le context
    const apiUserResult = await this.passemploiapi.putUser(account.sub, {
      nom: userInfo.given_name,
      prenom: userInfo.family_name,
      email: userInfo.email,
      structure: account.structure,
      type: account.type,
      username: userInfo.preferred_username
    })

    if (isFailure(apiUserResult)) {
      this.logger.error('Could not put user')
      this.apmService.captureError(new Error('Could not put user'))
      return apiUserResult
    }

    const result: InteractionResults = {
      login: { accountId },
      consent: { grantId: newGrantId },
      userType: this.userType,
      userStructure: this.userStructure,
      email: userInfo.email,
      family_name: userInfo.family_name,
      given_name: userInfo.given_name,
      userRoles: apiUserResult.data.userRoles,
      userId: apiUserResult.data.userId,
      preferred_username: userInfo.preferred_username
    }

    await this.oidcService.interactionFinished(request, response, result)
    return emptySuccess()
  }
}
