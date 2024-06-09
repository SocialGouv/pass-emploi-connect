import { Injectable, Logger } from '@nestjs/common'
import { DateService } from '../utils/date.service'
import { Account } from '../domain/account'
import { RedisClient } from '../redis/redis.client'
import { buildError } from '../utils/monitoring/logger.module'
import * as APM from 'elastic-apm-node'
import { getAPMInstance } from '../utils/monitoring/apm.init'

export enum TokenType {
  ACCESS = 'access_token',
  REFRESH = 'refresh_token'
}
export type TokenData = {
  token: string
  expiresIn: number
  scope?: string
}
type SavedTokenData = {
  token: string
  expiresAt: number
  scope?: string
}

@Injectable()
export class TokenService {
  private readonly logger: Logger
  protected apmService: APM.Agent

  constructor(
    private readonly redisClient: RedisClient,
    private readonly dateService: DateService
  ) {
    this.logger = new Logger('TokenService')
    this.apmService = getAPMInstance()
  }

  async getToken(
    account: Account,
    tokenType: TokenType
  ): Promise<TokenData | undefined> {
    const data = await this.redisClient.get(
      tokenType,
      Account.fromAccountToAccountId(account)
    )
    if (data) {
      try {
        const savedTokenData: SavedTokenData = JSON.parse(data)
        if (!savedTokenData.token || !savedTokenData.expiresAt) {
          throw new Error()
        }
        return this.fromSavedTokenToTokenData(savedTokenData)
      } catch (e) {
        this.apmService.captureError(e)
        this.logger.error(buildError('get token invalid data format', e))
      }
    }
    return undefined
  }

  async setToken(
    account: Account,
    tokenType: TokenType,
    tokenData: TokenData
  ): Promise<void> {
    const MARGIN_SECONDS = 1
    const ttl =
      tokenData.expiresIn > MARGIN_SECONDS
        ? tokenData.expiresIn - MARGIN_SECONDS
        : tokenData.expiresIn

    const tokenToSave = this.fromTokenDataToTokenToSave({
      ...tokenData,
      expiresIn: ttl
    })

    await this.redisClient.setWithExpiry(
      tokenType,
      Account.fromAccountToAccountId(account),
      JSON.stringify(tokenToSave),
      ttl
    )
  }

  private fromTokenDataToTokenToSave(tokenData: TokenData): SavedTokenData {
    const expiresAt = this.dateService
      .now()
      .plus({ seconds: tokenData.expiresIn })
      .toSeconds()
    return {
      token: tokenData.token,
      scope: tokenData.scope,
      expiresAt
    }
  }

  private fromSavedTokenToTokenData(savedTokenData: SavedTokenData): TokenData {
    const currentTimestamp = this.dateService.now().toSeconds()
    const expiresIn = savedTokenData.expiresAt - currentTimestamp
    return {
      token: savedTokenData.token,
      scope: savedTokenData.scope,
      expiresIn
    }
  }
}
