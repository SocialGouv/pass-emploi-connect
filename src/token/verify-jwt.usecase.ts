import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  JSONWebKeySet,
  JWK,
  JWTPayload,
  JWTVerifyGetKey,
  createLocalJWKSet,
  errors,
  importJWK,
  jwtVerify
} from 'jose'
import { JWKS } from 'oidc-provider'
import { DateTime } from 'luxon'

interface Inputs {
  token: string
}
@Injectable()
export class ValidateJWTUsecase {
  private readonly logger: Logger

  constructor(private configService: ConfigService) {
    this.logger = new Logger('ValidateJWTUsecase')
  }

  // TODO renvoyer une erreur métier
  async execute(inputs: Inputs): Promise<JWTPayload> {
    const JWKS = this.configService.get<JWKS>('jwks')!

    for (const JWK of JWKS.keys) {
      try {
        const importedJWK = await importJWK(JWK as JWK)
        const { payload } = await jwtVerify(inputs.token, importedJWK)

        if (!payload.exp || this.isExpired(payload.exp)) {
          throw errors.JWTExpired
        }
        return payload
      } catch (e) {}
    }
    throw errors.JWKSNoMatchingKey
  }

  private isExpired(exp: number): boolean {
    const expirationTime = DateTime.fromMillis(exp)
    const currentTime = DateTime.now()
    return currentTime < expirationTime
  }
}
