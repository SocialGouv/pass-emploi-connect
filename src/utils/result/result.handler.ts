import { User } from '../../domain/user'
import { Failure } from './result'

export function handleFailure(
  failure: Failure,
  userType: User.Type,
  userStructure: User.Structure
): { url: string } {
  // eslint-disable-next-line no-process-env
  const errorCallbackUrl = process.env.CLIENT_WEB_ERROR_CALLBACK!
  return {
    url: `${errorCallbackUrl}?reason=${
      failure.error.reason ?? failure.error.code
    }&typeUtilisateur=${userType}&structureUtilisateur=${userStructure}`
  }
}
