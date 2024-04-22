import { Inject, Logger } from '@nestjs/common'
import Redis from 'ioredis'
import { Adapter, AdapterPayload } from 'oidc-provider'
// @ts-ignore
import * as isEmpty from 'lodash.isempty'

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest'
])

const consumable = new Set([
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest'
])

function grantKeyFor(id: string) {
  return `grant:${id}`
}

function userCodeKeyFor(userCode: string) {
  return `userCode:${userCode}`
}

function uidKeyFor(uid: string) {
  return `uid:${uid}`
}

export class RedisAdapter implements Adapter {
  private logger: Logger

  constructor(
    private name: string,
    private readonly redisClient: Redis
  ) {
    this.logger = new Logger('RedisAdapter')
    this.logger.debug('Redis adapter created ' + this.name)
  }

  async upsert(id: string, payload: AdapterPayload, expiresIn: number) {
    try {
      this.logger.debug('REDIS UPSERT BEGIN %s %s %j', id, this.name, payload)
      const key = this.key(id)

      // initialize a new Redis transaction, all commands will be queued for atomic execution
      const multi = this.redisClient.multi()

      if (consumable.has(this.name)) {
        multi.hmset(key, { payload: JSON.stringify(payload) })
      } else {
        multi.set(key, JSON.stringify(payload))
      }

      if (expiresIn) {
        multi.expire(key, expiresIn)
      }

      if (grantable.has(this.name) && payload.grantId) {
        const grantKey = grantKeyFor(payload.grantId)
        multi.rpush(grantKey, key)
        // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
        // here to trim the list to an appropriate length
        const ttl = await this.redisClient.ttl(grantKey)
        if (expiresIn > ttl) {
          multi.expire(grantKey, expiresIn)
        }
      }

      if (payload.userCode) {
        const userCodeKey = userCodeKeyFor(payload.userCode)
        multi.set(userCodeKey, id)
        multi.expire(userCodeKey, expiresIn)
      }

      if (payload.uid) {
        const uidKey = uidKeyFor(payload.uid)
        multi.set(uidKey, id)
        multi.expire(uidKey, expiresIn)
      }

      await multi.exec() // execute the transaction, committing the changes
      this.logger.debug('REDIS UPSERT OK')
    } catch (e) {
      this.logger.debug('REDIS UPSERT ERROR')
      this.logger.debug(e)
    }
  }

  async find(id: string): Promise<AdapterPayload | undefined | void> {
    try {
      this.logger.debug('REDIS FIND BEGIN %s %s', id, this.name)
      const data = consumable.has(this.name)
        ? await this.redisClient.hgetall(this.key(id))
        : await this.redisClient.get(this.key(id))

      if (isEmpty(data)) {
        return undefined
      }

      if (typeof data === 'string') {
        return JSON.parse(data)
      }

      const { payload, ...rest } = data!
      this.logger.debug('REDIS FIND OK')
      return {
        ...rest,
        ...JSON.parse(payload)
      }
    } catch (e) {
      this.logger.debug('REDIS FIND ERROR')
      this.logger.debug(e)
      throw e
    }
  }

  async findByUid(uid: string) {
    const id = await this.redisClient.get(uidKeyFor(uid))
    if (id === null) return undefined
    return this.find(id)
  }

  async findByUserCode(userCode: string) {
    const id = await this.redisClient.get(userCodeKeyFor(userCode))
    if (id === null) return undefined
    return this.find(id)
  }

  async destroy(id: string): Promise<void> {
    const key = this.key(id)
    await this.redisClient.del(key)
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    // eslint-disable-line class-methods-use-this
    const multi = this.redisClient.multi()
    const tokens = await this.redisClient.lrange(grantKeyFor(grantId), 0, -1)
    tokens.forEach(token => multi.del(token))
    multi.del(grantKeyFor(grantId))
    await multi.exec()
  }

  async consume(id: string): Promise<void> {
    await this.redisClient.hset(
      this.key(id),
      'consumed',
      Math.floor(Date.now() / 1000)
    )
  }

  key(id: string) {
    return `${this.name}:${id}`
  }
}
