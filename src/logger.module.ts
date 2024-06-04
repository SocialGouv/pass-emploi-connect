import { DynamicModule } from '@nestjs/common'
import { IncomingMessage } from 'http'
import { LoggerModule } from 'nestjs-pino'
import { ReqId } from 'pino-http'
import { Request } from 'express'
import * as uuid from 'uuid'

export const configureLoggerModule = (): DynamicModule =>
  LoggerModule.forRoot({
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    pinoHttp: [
      {
        autoLogging: {
          ignore: (req: IncomingMessage): boolean => {
            if (req.url?.endsWith('/health')) {
              return true
            }
            return false
          }
        },
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]'
        ],
        formatters: {
          level(label): object {
            return { level: label }
          }
        },
        // eslint-disable-next-line no-process-env
        level: process.env.LOG_LEVEL ?? 'info',
        // TODO APM
        // mixin: (): (() => MixinFn) => {
        //   let currentTraceIds = getAPMInstance().currentTraceIds
        //   const apmEstDesactive = Object.keys(currentTraceIds).length === 0
        //   if (apmEstDesactive) {
        //     // @ts-ignore
        //     currentTraceIds =
        //       getWorkerTrackingServiceInstance().getCurrentJobTracking()
        //         ?.currentTraceIds
        //   }
        //   // @ts-ignore
        //   return !Object.keys(currentTraceIds).length ? {} : { currentTraceIds }
        // },
        genReqId: (request: Request): ReqId =>
          request.header('X-Request-ID') ?? uuid.v4()
      }
    ]
  })

export interface LogError {
  message: string
  err?: Error | string
}

export function buildError(message: string, error: Error): LogError {
  return {
    message,
    err: isEnumerable(error) ? error : error.stack
  }
}

function isEnumerable(error: Error): boolean {
  return Boolean(Object.keys(error).length)
}
