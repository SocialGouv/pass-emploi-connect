import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JWK, JWTPayload, errors, importJWK, jwtVerify } from 'jose'
import { DateTime } from 'luxon'
import { JWKS } from 'oidc-provider'

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
