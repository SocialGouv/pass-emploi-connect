import { Injectable, Logger } from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { RedisClient } from '../redis/redis.client'
import { getAPMInstance } from '../utils/monitoring/apm.init'
import { buildError } from '../utils/monitoring/logger.module'
import { AuthError } from '../utils/result/error'
import { Result, emptySuccess, failure } from '../utils/result/result'

interface Inputs {
  idAuth: string
}

@Injectable()
export class DeleteAccountUsecase {
  private readonly logger: Logger
  protected apmService: APM.Agent

  constructor(private readonly redisClient: RedisClient) {
    this.logger = new Logger('DeleteUserUsecase')
    this.apmService = getAPMInstance()
  }

  async execute(inputs: Inputs): Promise<Result> {
    try {
      await this.redisClient.deletePattern(inputs.idAuth)
      return emptySuccess()
    } catch (e) {
      this.logger.error(buildError('Erreur suppression tokens utilisateur', e))
      this.apmService.captureError(e)
      return failure(new AuthError('DELETE_TOKENS'))
    }
  }
}
