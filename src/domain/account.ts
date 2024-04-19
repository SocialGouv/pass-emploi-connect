import { User, UserAccount } from './user'

const separator = '|'
const typeIndex = 0
const structureIndex = 1
const subIndex = 2

export namespace Account {
  export function generateAccountId(userAccount: UserAccount): string {
    const accountIdArray = []
    accountIdArray[typeIndex] = userAccount.type
    accountIdArray[structureIndex] = userAccount.structure
    accountIdArray[subIndex] = userAccount.sub
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
