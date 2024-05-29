import { Injectable, Logger } from '@nestjs/common'
import { RedisClient } from '../redis/redis.client'
import { Account } from '../domain/account'
import { DateTime } from 'luxon'

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
  constructor(private readonly redisClient: RedisClient) {
    this.logger = new Logger('TokenService')
  }

  async getToken(
    user: Account,
    tokenType: 'access_token' | 'refresh_token'
  ): Promise<TokenData | undefined> {
    this.logger.debug('GET TOKEN %j', user)

    const data = await this.redisClient.get(
      tokenType,
      Account.fromAccountToAccountId(user)
    )
    if (data) {
      try {
        const savedTokenData: SavedTokenData = JSON.parse(data)
        return fromSavedTokenToTokenData(savedTokenData)
      } catch (e) {
        this.logger.warn('get token invalid data format')
      }
    }
    return undefined
  }

  async setToken(
    user: Account,
    tokenType: 'access_token' | 'refresh_token',
    tokenData: TokenData
  ): Promise<void> {
    this.logger.debug('SET TOKEN %s %j %j', tokenType, user, tokenData)

    const MARGIN_SECONDS = 1
    const ttl =
      tokenData.expiresIn > MARGIN_SECONDS
        ? tokenData.expiresIn - MARGIN_SECONDS
        : tokenData.expiresIn

    const tokenToSave = fromTokenDataToTokenToSave({
      ...tokenData,
      expiresIn: ttl
    })

    await this.redisClient.setWithExpiry(
      tokenType,
      Account.fromAccountToAccountId(user),
      JSON.stringify(tokenToSave),
      ttl
    )
  }
}

function fromTokenDataToTokenToSave(tokenData: TokenData): SavedTokenData {
  const currentTime = DateTime.now()
  const expiresAt = currentTime
    .plus({ seconds: tokenData.expiresIn })
    .toMillis()
  return {
    token: tokenData.token,
    scope: tokenData.scope,
    expiresAt
  }
}

function fromSavedTokenToTokenData(savedTokenData: SavedTokenData): TokenData {
  const NUMBER_OF_MILLISECONDS_IN_A_SECOND = 1000
  const currentTimestamp = DateTime.now().toMillis()
  const expiresIn = Math.floor(
    (savedTokenData.expiresAt - currentTimestamp) /
      NUMBER_OF_MILLISECONDS_IN_A_SECOND
  )
  return {
    token: savedTokenData.token,
    scope: savedTokenData.scope,
    expiresIn
  }
}
