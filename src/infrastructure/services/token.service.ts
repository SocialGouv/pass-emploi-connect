import { Injectable } from '@nestjs/common'
import { RedisClient } from '../redis/redis.client'
import { UserAccount } from '../../domain/user'
import { Account } from '../../domain/account'

@Injectable()
export class TokenService {
  constructor(private readonly redisClient: RedisClient) {}

  async getToken(
    user: UserAccount,
    tokenType: 'access_token' | 'refresh_token'
  ): Promise<{ token: string }> {
    this.redisClient.get(tokenType, Account.generateAccountId(user))
    return { token: 'test' }
  }

  async setToken(
    user: UserAccount,
    tokenType: 'access_token' | 'refresh_token',
    token: string,
    expiresIn: number
  ): Promise<void> {
    this.redisClient.setWithExpiry(
      tokenType,
      Account.generateAccountId(user),
      token,
      expiresIn
    )
  }
}
