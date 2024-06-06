import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Issuer } from 'openid-client'
import {
  ContextKeyType,
  ContextStorage
} from '../context-storage/context-storage.provider'
import { Account } from '../domain/account'
import { TokenData, TokenService } from './token.service'
import { Result, failure, success } from '../utils/result/result'
import { buildError } from '../utils/monitoring/logger.module'
import { NonTrouveError } from '../utils/result/error'
import { getIdpConfigIdentifier } from '../config/configuration'
import * as APM from 'elastic-apm-node'
import { getAPMInstance } from '../utils/monitoring/apm.init'

const MINIMUM_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 10

interface Inputs {
  account: Account
}

@Injectable()
export class GetAccessTokenUsecase {
  private readonly logger: Logger
  protected apmService: APM.Agent

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly context: ContextStorage
  ) {
    this.logger = new Logger('GetAccessTokenUsecase')
    this.apmService = getAPMInstance()
  }

  async execute(query: Inputs): Promise<Result<TokenData>> {
    try {
      const storedAccessTokenData = await this.tokenService.getToken(
        query.account,
        'access_token'
      )

      if (
        storedAccessTokenData &&
        storedAccessTokenData.expiresIn >
          MINIMUM_ACCESS_TOKEN_EXPIRES_IN_SECONDS
      ) {
        return success(storedAccessTokenData)
      }

      const newTokenDataResult = await this.refresh(query.account)
      return newTokenDataResult
    } catch (e) {
      this.logger.error(buildError('Erreur inconnue GET AccessTokenUsecase', e))
      this.apmService.captureError(e)
      return failure(new NonTrouveError('AcessToken'))
    }
  }

  private async refresh(account: Account): Promise<Result<TokenData>> {
    const refreshToken = await this.tokenService.getToken(
      account,
      'refresh_token'
    )

    if (!refreshToken) {
      this.logger.error("L'utilisateur n'a pas de refresh token")
      this.apmService.captureError(
        new Error("L'utilisateur n'a pas de refresh token")
      )
      return failure(
        new NonTrouveError("L'utilisateur n'a pas de refresh token")
      )
    }

    const [issuerConfig, clientConfig] = await Promise.all([
      this.context.get({
        userType: account.type,
        userStructure: account.structure,
        key: ContextKeyType.ISSUER
      }),
      this.context.get({
        userType: account.type,
        userStructure: account.structure,
        key: ContextKeyType.CLIENT
      })
    ])

    if (!issuerConfig || !clientConfig) {
      this.logger.error('Config introuvable pour le refresh')
      this.apmService.captureError(
        new Error('Config introuvable pour le refresh')
      )
      return failure(new NonTrouveError('Config introuvable pour le refresh'))
    }

    try {
      const issuer = new Issuer(JSON.parse(issuerConfig))
      const client = new issuer.Client(JSON.parse(clientConfig))

      const tokenSet = await client.refresh(refreshToken.token)
      const tokenData: TokenData = {
        token: tokenSet.access_token!,
        expiresIn:
          tokenSet.expires_in ??
          this.configService.get<number>(
            `${getIdpConfigIdentifier(
              account.type,
              account.structure
            )}.accessTokenMaxAge`
          )!,
        scope: tokenSet.scope
      }

      await this.tokenService.setToken(account, 'access_token', tokenData)

      return success(tokenData)
    } catch (e) {
      this.logger.error(buildError('Erreur refresh token', e))
      this.apmService.captureError(e)
      return failure(new NonTrouveError('Erreur refresh token'))
    }
  }
}
