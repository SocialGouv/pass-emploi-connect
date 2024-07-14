import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as APM from 'elastic-apm-node'
import { Request, Response } from 'express'
import { InteractionResults } from 'oidc-provider'
import {
  BaseClient,
  CallbackParamsType,
  Issuer,
  TokenSet,
  UserinfoResponse
} from 'openid-client'
import { FrancetravailAPIClient } from '../../api/francetravail-api.client'
import { PassEmploiAPIClient } from '../../api/pass-emploi-api.client'
import { IdpConfig } from '../../config/configuration'
import { Account } from '../../domain/account'
import { User, estBeneficiaireFT, estConseillerFT } from '../../domain/user'
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
import {
  createIdpClientConfig,
  createIdpIssuerConfig,
  generateNewGrantId,
  getIdpConfig
} from './helpers'

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
    this.idp = getIdpConfig(this.configService, userType, userStructure)

    const clientConfig = createIdpClientConfig(this.idp)
    const issuerConfig = createIdpIssuerConfig(this.idp)

    const issuer = new Issuer(issuerConfig)
    this.client = new issuer.Client(clientConfig)

    if (estConseillerFT(userType, userStructure)) {
      const backupIssuerConfig = createIdpIssuerConfig({
        ...this.idp,
        issuer: this.idp.backupIssuer!
      })
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

      const { nom, prenom, email } = await this.getCoordonnees(
        userInfo,
        tokenSet.access_token!
      )

      // besoin de persister le preferred_username parce que le get token n'a pas cette info dans le context
      const apiUserResult = await this.passemploiapi.putUser(userInfo.sub, {
        nom,
        prenom,
        email,
        structure: this.userStructure,
        type: this.userType,
        username: userInfo.preferred_username
      })

      if (isFailure(apiUserResult)) {
        this.logger.error('Callback PUT user error')
        this.apmService.captureError(new Error('Callback PUT user error'))
        return apiUserResult
      }

      const typeUtilisateurFinal = apiUserResult.data.userType
      const structureUtilisateurFinal = apiUserResult.data.userStructure
      const account = {
        sub: userInfo.sub,
        type: typeUtilisateurFinal,
        structure: structureUtilisateurFinal
      }
      const accountId = Account.fromAccountToAccountId(account)
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
        userType: typeUtilisateurFinal,
        userStructure: structureUtilisateurFinal,
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

  private async getCoordonnees(
    userInfoFromIdToken: UserinfoResponse,
    accessToken: string
  ): Promise<{
    nom?: string
    prenom?: string
    email?: string
  }> {
    let coordonnees
    if (estBeneficiaireFT(this.userType, this.userStructure)) {
      const coordonneesResult = await this.francetravailapi.getCoordonness(
        accessToken
      )
      if (isSuccess(coordonneesResult)) {
        coordonnees = coordonneesResult.data
      }
    }
    const nom = coordonnees?.nom ?? userInfoFromIdToken.family_name
    const prenom = coordonnees?.prenom ?? userInfoFromIdToken.given_name
    const email = coordonnees?.email ?? userInfoFromIdToken.email

    return { nom, prenom, email }
  }
}
