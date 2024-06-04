import { JWTPayload } from 'jose'
import { Account } from '../../src/domain/account'
import { User } from '../../src/domain/user'
import { PassEmploiUser } from '../../src/pass-emploi-api/pass-emploi-api.service'
import { TokenData } from '../../src/token/token.service'

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

export const unPassEmploiUser = (
  args: Partial<PassEmploiUser> = {}
): PassEmploiUser => {
  const defaults: PassEmploiUser = {
    type: User.Type.CONSEILLER,
    structure: User.Structure.MILO,
    prenom: 'Bruno',
    nom: 'Dumont',
    email: 'zema@octo.com',
    username: 'b.dumont'
  }

  return { ...defaults, ...args }
}

export const unTokenData = (args: Partial<TokenData> = {}): TokenData => {
  const defaults: TokenData = {
    token: 'un-token',
    expiresIn: 100,
    scope: ''
  }

  return { ...defaults, ...args }
}

export const unJwtPayloadValide = (): JWTPayload => ({
  aud: 'https://api.pass-emploi.incubateur.net',
  client_id: 'pass-emploi-swagger',
  email: 'frep+bdumont@octo.com',
  exp: 1717489640,
  family_name: 'Bernard',
  given_name: 'Dumond',
  iat: 1717487840,
  iss: 'https://id.pass-emploi.incubateur.net',
  jti: 'lv4lwzTINyr8l_WVVFmgn',
  preferred_username: 'b.dumont',
  scope: 'openid email profile',
  sub: 'CONSEILLER|MILO|df095ff0-23e9-48d3-8e26-358c3e614881',
  userId: 'cc03c25e-950e-4434-8103-583b8d9c29b3',
  userRoles: ['SUPERVISEUR'],
  userStructure: 'MILO',
  userType: 'CONSEILLER'
})
