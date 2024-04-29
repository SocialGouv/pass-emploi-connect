// prend en input un user account et renoive un access token en output
// cherche access token dans le redis
// gerer le cas ou l'access token expire bientot (30s) et du coup lancer le refresh
// si l'access token est valide il le retourne

// sinon on le refresh en appelant l'idp sur l'url de refresh

// si reussi, on stock le nouveau acces token
// calul expires at avant de le stocker

// dès qu'on a une erreur => erreur indépendante de oidc module interprétées comme erreur métier et qu"on puisse renvoyer invalid grant

// tout à la fin calcule expires in

// retourne access token, expires in et scope

import { Injectable, Logger } from '@nestjs/common'
import { UserAccount } from '../domain/user'
import { TokenData, TokenService } from './token.service'

interface Inputs {
  userAccount: UserAccount
}

@Injectable()
export class GetAccessTokenUsecase {
  private readonly logger: Logger

  constructor(private readonly tokenService: TokenService) {
    this.logger = new Logger('GetAccessTokenUsecase')
  }

  async execute(query: Inputs): Promise<TokenData | undefined> {
    try {
      const tokenData = await this.tokenService.getToken(
        query.userAccount,
        'access_token'
      )

      return tokenData
    } catch (error) {
      return undefined
    }
  }
}
