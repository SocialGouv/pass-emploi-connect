import { DynamicModule } from '@nestjs/common'
import { IncomingMessage } from 'http'
import { LoggerModule } from 'nestjs-pino'

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
        level: process.env.LOG_LEVEL ?? 'info'
      }
    ]
  })

export interface LogError {
  message: string
  err: Error
}

export function buildError(message: string, error: Error): LogError {
  return {
    message,
    err: error
  }
}
