import { Injectable, Logger } from '@nestjs/common'
import { RedisClient } from '../redis/redis.client'
import { UserAccount } from '../domain/user'
import { Account } from '../domain/account'

@Injectable()
export class TokenService {
  private readonly logger: Logger
  constructor(private readonly redisClient: RedisClient) {
    this.logger = new Logger('TokenService')
  }

  async getToken(
    user: UserAccount,
    tokenType: 'access_token' | 'refresh_token'
  ): Promise<{ token: string }> {
    this.logger.debug('GET TOKEN %j', user)
    await this.redisClient.get(tokenType, Account.generateAccountId(user))
    return { token: 'test' }
  }

  async setToken(
    user: UserAccount,
    tokenType: 'access_token' | 'refresh_token',
    token: string,
    expiresIn: number
  ): Promise<void> {
    this.logger.debug('SET TOKEN %j', user)
    await this.redisClient.setWithExpiry(
      tokenType,
      Account.generateAccountId(user),
      token,
      expiresIn
    )
  }
}
