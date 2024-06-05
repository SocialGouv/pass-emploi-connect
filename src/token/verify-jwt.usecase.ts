import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JWK, JWTPayload, errors, importJWK, jwtVerify } from 'jose'
import { DateTime } from 'luxon'
import { JWKS } from 'oidc-provider'
import { DateService } from '../date.service'
import { JWTError } from '../result/error'
import { Result, failure, success } from '../result/result'
import * as APM from 'elastic-apm-node'
import { getAPMInstance } from '../apm.init'

interface Inputs {
  token: string
}
@Injectable()
export class ValidateJWTUsecase {
  private readonly logger: Logger
  protected apmService: APM.Agent

  constructor(
    private configService: ConfigService,
    private dateService: DateService
  ) {
    this.logger = new Logger('ValidateJWTUsecase')
    this.apmService = getAPMInstance()
  }

  async execute(inputs: Inputs): Promise<Result<JWTPayload>> {
    const JWKS = this.configService.get<JWKS>('jwks')!
    const error: JWTError = new JWTError(errors.JWKSNoMatchingKey.code)

    for (const JWK of JWKS.keys) {
      try {
        const importedJWK = await importJWK(JWK as JWK)
        const { payload } = await jwtVerify(inputs.token, importedJWK)

        if (this.isExpired(payload.exp)) {
          error.code = errors.JWTExpired.code
          return failure(error)
        }
        return success(payload)
      } catch (e) {
        error.code = e.code ?? errors.JWKSNoMatchingKey.code
      }
    }
    return failure(error)
  }

  private isExpired(exp?: number): boolean {
    if (!exp) {
      return true
    }
    const tokenExpirationTime =
      DateTime.fromSeconds(exp).setZone('Europe/Paris')
    const currentTime = this.dateService.now().setZone('Europe/Paris')
    return tokenExpirationTime.toUTC() < currentTime.toUTC()
  }
}
