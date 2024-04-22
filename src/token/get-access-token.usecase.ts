// prend en input un user account et renoive un access token en output
// cherche access token dans le redis
// gerer le cas ou l'access token expire bientot (30s) et du coup lancer le refresh
// si l'access token est valide il le retourne

// sinon on le refresh en appelant l'idp sur l'url de refresh

// si reussi, on stock le nouveau acces token
// calul expires at avant de le stocker

// dès qu'on a une erreur => erreur indépendante de oidc module interprétées comme erreur métier et qu"on puisse renvoyer invalid grant

// tout à la fin calcule expires in

// retourne access token, expires in et scope

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  createRemoteJWKSet,
  errors,
  JWTPayload,
  jwtVerify,
  JWTVerifyGetKey
} from 'jose'
import { Issuer } from 'openid-client'

@Injectable()
export class GetAccessTokenUsecase {
  private readonly logger: Logger

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger('JWTService')
  }

  private cacheJWKS: JWTVerifyGetKey | undefined

  async verifyTokenAndGetJwt(token: string): Promise<JWTPayload> {
    try {
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
