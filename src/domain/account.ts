import { User } from './user'

const separator = '|'
const typeIndex = 0
const structureIndex = 1
const subIndex = 2

export namespace Account {
  export function generateAccountId(
    sub: string,
    type: User.Type,
    structure: User.Structure
  ): string {
    const accountIdArray = []
    accountIdArray[typeIndex] = type
    accountIdArray[structureIndex] = structure
    accountIdArray[subIndex] = sub
    return accountIdArray.join(separator)
  }

  export function getSubFromAccountId(accountId: string): string {
    return accountId.split(separator)[subIndex]
  }
  export function getTypeFromAccountId(accountId: string): User.Type {
    return accountId.split(separator)[typeIndex] as User.Type
  }
  export function getStructureFromAccountId(accountId: string): User.Structure {
    return accountId.split(separator)[structureIndex] as User.Structure
  }
}
