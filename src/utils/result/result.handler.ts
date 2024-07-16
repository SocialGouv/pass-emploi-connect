import { HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { Failure } from './result'

export function redirectFailure(response: Response, failure: Failure): void {
  // eslint-disable-next-line no-process-env
  const errorCallbackUrl = process.env.CLIENT_WEB_ERROR_CALLBACK!
  const url = `${errorCallbackUrl}?reason=${
    failure.error.reason ?? failure.error.code
  }`
  response.redirect(HttpStatus.TEMPORARY_REDIRECT, url)
}
