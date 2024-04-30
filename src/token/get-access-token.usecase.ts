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
import { Issuer, TokenSet } from 'openid-client'
import { Context, ContextKey } from '../context/context.provider'

interface Inputs {
  userAccount: UserAccount
}

@Injectable()
export class GetAccessTokenUsecase {
  private readonly logger: Logger

  constructor(
    private readonly tokenService: TokenService,
    private readonly context: Context
  ) {
    this.logger = new Logger('GetAccessTokenUsecase')
  }

  async execute(query: Inputs): Promise<TokenData | undefined> {
    try {
      const tokenData = await this.tokenService.getToken(
        query.userAccount,
        'access_token'
      )

      try {
        const refreshToken = await this.refresh(query.userAccount)
        this.logger.debug(refreshToken)
      } catch (e) {
        this.logger.debug('ERR refresh')
        this.logger.error(e)
      }

      return tokenData
    } catch (error) {
      return undefined
    }
  }

  private async refresh(userAccount: UserAccount): Promise<TokenSet> {
    const refreshToken = await this.tokenService.getToken(
      userAccount,
      'refresh_token'
    )

    if (!refreshToken) {
      throw Error("l'utilisateur n'est pas authentifié")
    }

    const issuerConfig = JSON.parse(
      this.context.get(ContextKey.FT_CONSEILLER_ISSUER)
    )
    // TODO traiter l'erreur undefined is not a valid json
    this.logger.debug('HERE')
    this.logger.debug('%j', issuerConfig)
    const clientConfig = JSON.parse(
      this.context.get(ContextKey.FT_CONSEILLER_CLIENT)
    )
    const issuer = new Issuer(issuerConfig)
    const client = new issuer.Client(clientConfig)

    const tokenSet = await client.refresh(refreshToken.token)

    this.tokenService.setToken(userAccount, 'access_token', {
      token: tokenSet.access_token!,
      expiresIn: tokenSet.expires_in ?? 60,
      scope: tokenSet.scope
    })

    return tokenSet
  }
}
