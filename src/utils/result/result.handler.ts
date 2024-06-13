import { Response } from 'express'
import { User } from '../../domain/user'
import { Failure } from './result'
import { HttpStatus } from '@nestjs/common'

export function redirectFailure(
  response: Response,
  failure: Failure,
  userType: User.Type,
  userStructure: User.Structure
): void {
  // eslint-disable-next-line no-process-env
  const errorCallbackUrl = process.env.CLIENT_WEB_ERROR_CALLBACK!
  const url = `${errorCallbackUrl}?reason=${
    failure.error.reason ?? failure.error.code
  }&typeUtilisateur=${userType}&structureUtilisateur=${userStructure}`

  response.redirect(HttpStatus.TEMPORARY_REDIRECT, url)
}
