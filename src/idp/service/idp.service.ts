import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as APM from 'elastic-apm-node'
import { Request, Response } from 'express'
import { ClientAuthMethod, InteractionResults } from 'oidc-provider'
import { BaseClient, CallbackParamsType, Issuer, TokenSet } from 'openid-client'
import { FrancetravailAPIClient } from '../../api/francetravail-api.client'
import { PassEmploiAPIClient } from '../../api/pass-emploi-api.client'
import { IdpConfig, getIdpConfigIdentifier } from '../../config/configuration'
import {
  ContextKeyType,
  ContextStorage
} from '../../context-storage/context-storage.provider'
import { Account } from '../../domain/account'
import { User, estConseillerFT, estJeuneFT } from '../../domain/user'
import { OidcService } from '../../oidc-provider/oidc.service'
import { TokenService, TokenType } from '../../token/token.service'
import { getAPMInstance } from '../../utils/monitoring/apm.init'
import { buildError } from '../../utils/monitoring/logger.module'
import { AuthError } from '../../utils/result/error'
import {
  Result,
  emptySuccess,
  failure,
  isFailure,
  isSuccess,
  success
} from '../../utils/result/result'
import { generateNewGrantId } from './helpers'

export abstract class IdpService {
  private idpName: string
  protected logger: Logger
  private userType: User.Type
  private userStructure: User.Structure
  private idp: IdpConfig
  private client: BaseClient
  private backupClient: BaseClient
  protected apmService: APM.Agent

  constructor(
    idpName: string,
    userType: User.Type,
    userStructure: User.Structure,
    private readonly contextStorage: ContextStorage,
    private readonly configService: ConfigService,
    private readonly oidcService: OidcService,
    private readonly tokenService: TokenService,
    private readonly passemploiapi: PassEmploiAPIClient,
    private readonly francetravailapi: FrancetravailAPIClient
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
    const clientConfig = {
      client_id: this.idp.clientId,
      client_secret: this.idp.clientSecret,
      redirect_uris: [this.idp.redirectUri],
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      scope: this.idp.scopes,
      token_endpoint_auth_method: 'client_secret_post' as ClientAuthMethod
    }
    const issuerConfig = {
      issuer: this.idp.issuer,
      authorization_endpoint: this.idp.authorizationUrl,
      token_endpoint: this.idp.tokenUrl,
      jwks_uri: this.idp.jwks,
      userinfo_endpoint: this.idp.userinfo
    }
    this.contextStorage.set(
      {
        userType: this.userType,
        userStructure: this.userStructure,
        key: ContextKeyType.CLIENT
      },
      JSON.stringify(clientConfig)
    )
    this.contextStorage.set(
      {
        userType: this.userType,
        userStructure: this.userStructure,
        key: ContextKeyType.ISSUER
      },
      JSON.stringify(issuerConfig)
    )

    const issuer = new Issuer(issuerConfig)
    this.client = new issuer.Client(clientConfig)

    if (estConseillerFT(userType, userStructure)) {
      const backupIssuerConfig = {
        issuer: this.idp.backupIssuer!,
        authorization_endpoint: this.idp.authorizationUrl,
        token_endpoint: this.idp.tokenUrl,
        jwks_uri: this.idp.jwks,
        userinfo_endpoint: this.idp.userinfo
      }
      const ftBackupIssuer = new Issuer(backupIssuerConfig)
      this.backupClient = new ftBackupIssuer.Client(clientConfig)
    }
  }

  getAuthorizationUrl(interactionId: string, state?: string): Result<string> {
    try {
      const url = this.client.authorizationUrl({
        nonce: interactionId,
        realm: this.idp.realm,
        scope: this.idp.scopes,
        state
      })
      return success(url)
    } catch (e) {
      this.apmService.captureError(e)
      this.logger.error(
        buildError(`Authorize error ${this.userType} ${this.userStructure}`, e)
      )
      return failure(new AuthError('AUTHORIZE'))
    }
  }

  async callback(request: Request, response: Response): Promise<Result> {
    try {
      const interactionDetails = await this.oidcService.interactionDetails(
        request,
        response
      )
      const params = this.client.callbackParams(request)

      const tokenSet = await this.callbackWithRetry(
        request,
        params,
        interactionDetails.uid
      )

      const userInfo = await this.client.userinfo(tokenSet, {
        params: { realm: this.idp.realm }
      })

      const account = {
        sub: userInfo.sub,
        type: this.userType,
        structure: this.userStructure
      }
      const accountId = Account.fromAccountToAccountId(account)

      let coordonnees
      if (estJeuneFT(this.userType, this.userStructure)) {
        const coordonneesResult = await this.francetravailapi.getCoordonness(
          tokenSet.access_token!
        )
        if (isSuccess(coordonneesResult)) {
          coordonnees = coordonneesResult.data
        }
      }
      const nom = coordonnees?.nom ?? userInfo.given_name
      const prenom = coordonnees?.prenom ?? userInfo.family_name
      const email = coordonnees?.email ?? userInfo.email

      // besoin de persister le preferred_username parce que le get token n'a pas cette info dans le context
      const apiUserResult = await this.passemploiapi.putUser(account.sub, {
        nom,
        prenom,
        email,
        structure: account.structure,
        type: account.type,
        username: userInfo.preferred_username
      })

      if (isFailure(apiUserResult)) {
        this.logger.error('Callback PUT user error')
        this.apmService.captureError(new Error('Callback PUT user error'))
        return apiUserResult
      }

      const { grantId } = interactionDetails
      const newGrantId = await generateNewGrantId(
        this.configService,
        this.oidcService,
        accountId,
        interactionDetails.params.client_id as string,
        grantId
      )

      const result: InteractionResults = {
        login: { accountId },
        consent: { grantId: newGrantId },
        userType: this.userType,
        userStructure: this.userStructure,
        email: email,
        family_name: nom,
        given_name: prenom,
        userRoles: apiUserResult.data.userRoles,
        userId: apiUserResult.data.userId,
        preferred_username: userInfo.preferred_username
      }

      await this.tokenService.setToken(account, TokenType.ACCESS, {
        token: tokenSet.access_token!,
        expiresIn: tokenSet.expires_in || this.idp.accessTokenMaxAge,
        scope: tokenSet.scope,
        expiresAt: tokenSet.expires_at
      })
      if (tokenSet.refresh_token) {
        await this.tokenService.setToken(account, TokenType.REFRESH, {
          token: tokenSet.refresh_token,
          expiresIn: this.idp.refreshTokenMaxAge,
          scope: tokenSet.scope
        })
      }

      await this.oidcService.interactionFinished(request, response, result)
      return emptySuccess()
    } catch (e) {
      this.apmService.captureError(e)
      this.logger.error(
        buildError(`Callback error ${this.userType} ${this.userStructure}`, e)
      )
      return failure(new AuthError('Retour Pass Emploi'))
    }
  }

  private async callbackWithRetry(
    request: Request,
    params: CallbackParamsType,
    nonce: string
  ): Promise<TokenSet> {
    try {
      const tokenSet = await this.callbackWithoutRetry(
        request,
        params,
        nonce,
        this.client
      )
      return tokenSet
    } catch (e) {
      if (estConseillerFT(this.userType, this.userStructure)) {
        this.logger.error(buildError('PB Conseiller FT', e))
        this.apmService.captureError(e)
        return this.callbackWithoutRetry(
          request,
          params,
          nonce,
          this.backupClient
        )
      }
      this.logger.error(buildError('PB callback', e))
      this.apmService.captureError(e)
      throw e
    }
  }

  private async callbackWithoutRetry(
    request: Request,
    params: CallbackParamsType,
    nonce: string,
    client: BaseClient
  ): Promise<TokenSet> {
    return client.callback(this.idp.redirectUri, params, {
      nonce,
      state: request.query.state ? (request.query.state as string) : undefined
    })
  }
}
