import { expect } from 'chai'
import { Redis } from 'ioredis'
import { RedisClient } from '../../src/redis/redis.client'
import { StubbedClass, stubClass } from '../test-utils'

describe('RedisClient', () => {
  let redisClient: RedisClient
  let redis: StubbedClass<Redis>

  beforeEach(() => {
    redis = stubClass(Redis)
    redisClient = new RedisClient(redis)
  })
  describe('get', () => {
    it('get', async () => {
      // Given
      redis.get.resolves('res')

      // When
      const res = await redisClient.get('pref', 'key')

      // Then
      expect(res).to.equal('res')
      expect(redis.get).to.have.been.calledOnceWithExactly('pref:key')
    })
  })

  describe('set', () => {
    it('set', async () => {
      // Given
      redis.set.resolves()

      // When
      await redisClient.set('pref', 'key', 'value')

      // Then
      expect(redis.set).to.have.been.calledOnceWithExactly('pref:key', 'value')
    })
  })

  describe('delete', () => {
    it('delete', async () => {
      // Given
      redis.del.resolves()

      // When
      await redisClient.delete('pref', 'key')

      // Then
      expect(redis.del).to.have.been.calledOnceWithExactly('pref:key')
    })
  })
  describe('deletePattern', () => {
    it('deletePattern', async () => {
      // Given
      redis.keys.resolves(['oidc:ok', 'abc'])
      redis.del.resolves()

      // When
      await redisClient.deletePattern('nimp')

      // Then
      expect(redis.keys).to.have.been.calledOnceWithExactly('*nimp*')
      expect(redis.del).to.have.been.calledTwice()
      expect(redis.del).to.have.been.calledWithExactly('ok')
      expect(redis.del).to.have.been.calledWithExactly('abc')
    })
  })
  describe('setWithExpiry', () => {
    it('setWithExpiry', async () => {
      // Given
      redis.set.resolves()

      // When
      await redisClient.setWithExpiry('pref', 'key', 'value', 10)

      // Then
      expect(redis.set).to.have.been.calledOnceWithExactly(
        'pref:key',
        'value',
        'EX',
        10
      )
    })
  })
})
