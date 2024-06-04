import { expect } from 'chai'
import { DateService } from '../../src/date.service'
import { Account } from '../../src/domain/account'
import { RedisClient } from '../../src/redis/redis.client'
import { TokenData, TokenService } from '../../src/token/token.service'
import { StubbedClass, stubClass } from '../utils'
import { unAccount, uneDatetime } from '../utils/fixtures'

describe('TokenService', () => {
  let tokenService: TokenService
  let redisClient: StubbedClass<RedisClient>
  let dateService: StubbedClass<DateService>
  const maintenant = uneDatetime()

  beforeEach(() => {
    redisClient = stubClass(RedisClient)
    dateService = stubClass(DateService)
    tokenService = new TokenService(redisClient, dateService)
  })
  describe('setToken', () => {
    it('set un SavedTokenData', async () => {
      // Given
      const tokenData: TokenData = {
        token: 'tok',
        expiresIn: 300,
        scope: ''
      }
      dateService.now.returns(maintenant)

      // When
      await tokenService.setToken(unAccount(), 'access_token', tokenData)

      // Then
      expect(redisClient.setWithExpiry).to.have.been.calledOnceWithExactly(
        'access_token',
        Account.fromAccountToAccountId(unAccount()),
        JSON.stringify({
          token: tokenData.token,
          scope: tokenData.scope,
          expiresAt: 1717243499
        }),
        299
      )
    })
  })
  describe('getToken', () => {
    it('get un SavedTokenData et le transforme en TokenData', async () => {
      // Given
      const saved = {
        token: 'tok',
        scope: '',
        expiresAt: 1717243499
      }
      redisClient.get.resolves(JSON.stringify(saved))
      dateService.now.returns(maintenant)

      // When
      const tokenData = await tokenService.getToken(unAccount(), 'access_token')

      // Then
      expect(redisClient.get).to.have.been.calledOnceWithExactly(
        'access_token',
        Account.fromAccountToAccountId(unAccount())
      )
      expect(tokenData).to.deep.equal({
        token: 'tok',
        scope: '',
        expiresIn: 299
      })
    })
  })
})
