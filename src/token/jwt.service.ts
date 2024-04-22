import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  createRemoteJWKSet,
  errors,
  JWTPayload,
  jwtVerify,
  JWTVerifyGetKey,
  generateKeyPair
} from 'jose'
import { Issuer } from 'openid-client'

@Injectable()
export class JWTService {
  private readonly logger: Logger

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger('JWTService')
  }

  private cacheJWKS: JWTVerifyGetKey | undefined

  async verifyTokenAndGetJwt(token: string): Promise<JWTPayload> {
    try {
      const keyPair = await generateKeyPair('ES384')
      this.logger.debug('######## %j', keyPair)
      return await this.verifyTokenAndGetJwtWithoutRetry(token)
    } catch (error) {
      if (error instanceof errors.JWKSNoMatchingKey) {
        this.cacheJWKS = undefined
        return this.verifyTokenAndGetJwtWithoutRetry(token)
      }
      throw error
    }
  }

  private async verifyTokenAndGetJwtWithoutRetry(
    token: string
  ): Promise<JWTPayload> {
    const JWKS = await this.getJWKS()
    const { payload } = await jwtVerify(token, JWKS)
    return payload
  }

  private async getJWKS(): Promise<JWTVerifyGetKey> {
    if (!this.cacheJWKS) {
      const issuerUrl = `${this.configService.get('publicAddress')}/oidc/jwks`
      this.logger.debug(issuerUrl)
      const issuer = await Issuer.discover(issuerUrl)
      this.cacheJWKS = createRemoteJWKSet(
        new URL(new URL(issuer.metadata.jwks_uri!))
      )
    }
    return this.cacheJWKS
  }
}
