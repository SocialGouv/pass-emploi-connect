import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as APM from 'elastic-apm-node'
import { Issuer } from 'openid-client'
import { getIdpConfigIdentifier } from '../config/configuration'
import {
  ContextKeyType,
  ContextStorage
} from '../context-storage/context-storage.provider'
import { Account } from '../domain/account'
import { getAPMInstance } from '../utils/monitoring/apm.init'
import { buildError } from '../utils/monitoring/logger.module'
import { AuthError, NonTrouveError } from '../utils/result/error'
import { Result, failure, success } from '../utils/result/result'
import { TokenData, TokenService, TokenType } from './token.service'

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
        TokenType.ACCESS
      )

      if (storedAccessTokenData) {
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
      TokenType.REFRESH
    )

    if (!refreshToken) {
      this.logger.error("L'utilisateur n'a pas de refresh token")
      this.apmService.captureError(
        new Error("L'utilisateur n'a pas de refresh token")
      )
      return failure(new NonTrouveError('Refresh token'))
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
      return failure(new NonTrouveError('Config pour le refresh'))
    }

    try {
      const issuer = new Issuer(JSON.parse(issuerConfig))
      const client = new issuer.Client(JSON.parse(clientConfig))

      const tokenSet = await client.refresh(refreshToken.token)

      const tokenData: TokenData = {
        token: tokenSet.access_token!,
        expiresIn:
          tokenSet.expires_in ||
          (this.configService.get('idps')[
            getIdpConfigIdentifier(account.type, account.structure)
          ].accessTokenMaxAge! as number),
        expiresAt: tokenSet.expires_at,
        scope: tokenSet.scope
      }

      await this.tokenService.setToken(account, TokenType.ACCESS, tokenData)
      if (tokenSet.refresh_token) {
        await this.tokenService.setToken(account, TokenType.REFRESH, {
          token: tokenSet.refresh_token,
          expiresIn: this.configService.get('idps')[
            getIdpConfigIdentifier(account.type, account.structure)
          ].refreshTokenMaxAge! as number,
          scope: tokenSet.scope
        })
      }
      return success(tokenData)
    } catch (e) {
      this.logger.error(
        `Erreur refresh token ${account.type} ${account.structure}`
      )
      this.logger.error(
        buildError(
          `Erreur refresh token ${account.type} ${account.structure}`,
          e
        )
      )
      this.apmService.captureError(e)
      return failure(
        new AuthError(
          `ERROR_REFRESH_TOKEN_IDP_${account.type}_${account.structure}`
        )
      )
    }
  }
}
