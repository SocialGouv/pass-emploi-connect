import { User } from '../../domain/user'
import { NonTraitable } from './error'
import { isFailure, Result } from './result'

export function handleResult(
  result: Result,
  userType: User.Type,
  userStructure: User.Structure
): { url: string } | void {
  if (isFailure(result)) {
    switch (result.error.code) {
      case NonTraitable.CODE:
        // eslint-disable-next-line no-process-env
        const errorCallbackUrl = process.env.CLIENT_WEB_ERROR_CALLBACK!
        return {
          url: `${errorCallbackUrl}?reason=${result.error.reason}&typeUtilisateur=${userType}&structureUtilisateur=${userStructure}`
        }
    }
  }
}
