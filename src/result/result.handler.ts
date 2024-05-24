import { NonTraitable } from './error'
import { isFailure, Result } from './result'

export function handleResult(result: Result): { message: string } | void {
  if (isFailure(result)) {
    switch (result.error.code) {
      case NonTraitable.CODE:
        return { message: result.error.message }
    }
  }
}
