import { Injectable, Logger } from '@nestjs/common'
import { RedisClient } from '../redis/redis.client'
import { UserAccount } from '../domain/user'
import { Account } from '../domain/account'

type TokenData = { token: string; expiresIn?: number; scope?: string }
const ONE_DAY_IN_SECONDS = 3600 * 24
const SIX_MONTHS_IN_SECONDS = 3600 * 24 * 30 * 6

@Injectable()
export class TokenService {
  private readonly logger: Logger
  constructor(private readonly redisClient: RedisClient) {
    this.logger = new Logger('TokenService')
  }

  async getToken(
    user: UserAccount,
    tokenType: 'access_token' | 'refresh_token'
  ): Promise<TokenData | undefined> {
    this.logger.debug('GET TOKEN %j', user)

    const data = await this.redisClient.get(
      tokenType,
      Account.generateAccountId(user)
    )
    if (data) {
      try {
        return JSON.parse(data)
      } catch (e) {}
    }
    return undefined
  }

  async setToken(
    user: UserAccount,
    tokenType: 'access_token' | 'refresh_token',
    tokenData: TokenData
  ): Promise<void> {
    this.logger.debug('SET TOKEN %s %j %j', tokenType, user, tokenData)

    let ttl = tokenData.expiresIn
    if (!ttl) {
      switch (tokenType) {
        case 'access_token':
          ttl = ONE_DAY_IN_SECONDS
          break
        case 'refresh_token':
          ttl = SIX_MONTHS_IN_SECONDS
      }
    }

    // a recalculer, pas avec le expiresAt (car pas standard) (-1 seconde pour enlever la marge d'erreur) pas une logique

    await this.redisClient.setWithExpiry(
      tokenType,
      Account.generateAccountId(user),
      JSON.stringify(tokenData),
      ttl
    )
  }
}
