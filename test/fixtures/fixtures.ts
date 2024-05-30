import { Account } from '../../src/domain/account'
import { User } from '../../src/domain/user'

export const unAccount = (args: Partial<Account> = {}): Account => {
  const defaults: Account = {
    sub: 'un-sub',
    type: User.Type.CONSEILLER,
    structure: User.Structure.MILO
  }

  return { ...defaults, ...args }
}

export const unUser = (args: Partial<User> = {}): User => {
  const defaults: User = {
    userId: 'un-id',
    userType: User.Type.CONSEILLER,
    userStructure: User.Structure.MILO,
    userRoles: [],
    given_name: 'Bruno',
    family_name: 'Dumont',
    email: 'zema@octo.com',
    preferred_username: 'b.dumont'
  }

  return { ...defaults, ...args }
}
