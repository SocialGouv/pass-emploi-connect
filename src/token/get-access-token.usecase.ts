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
import { Issuer } from 'openid-client'
import {
  ContextStorage,
  ContextKey,
  ContextKeyType
} from '../context-storage/context-storage.provider'
import { UserAccount } from '../domain/user'
import { TokenData, TokenService } from './token.service'
import { ConfigService } from '@nestjs/config'

const MINIMUM_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 10

interface Inputs {
  userAccount: UserAccount
}

@Injectable()
export class GetAccessTokenUsecase {
  private readonly logger: Logger

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly context: ContextStorage
  ) {
    this.logger = new Logger('GetAccessTokenUsecase')
  }

  async execute(query: Inputs): Promise<TokenData | undefined> {
    try {
      const storedAccessTokenData = await this.tokenService.getToken(
        query.userAccount,
        'access_token'
      )

      if (
        storedAccessTokenData &&
        storedAccessTokenData.expiresIn >
          MINIMUM_ACCESS_TOKEN_EXPIRES_IN_SECONDS
      ) {
        return storedAccessTokenData
      }

      this.logger.debug('OK?')
      const newAccessTokenData = await this.refresh(query.userAccount)
      this.logger.debug('OK!')
      return newAccessTokenData
    } catch (e) {
      this.logger.error(e)
      return undefined
    }
  }

  private async refresh(userAccount: UserAccount): Promise<TokenData> {
    const refreshToken = await this.tokenService.getToken(
      userAccount,
      'refresh_token'
    )

    if (!refreshToken) {
      this.logger.error("L'utilisateur n'a pas de refresh token")
      throw Error("L'utilisateur n'a pas de refresh token")
    }

    this.logger.debug('Refresh token')
    const [issuerConfig, clientConfig] = await Promise.all([
      this.context.get({
        userType: userAccount.type,
        userStructure: userAccount.structure,
        key: ContextKeyType.ISSUER
      }),
      this.context.get({
        userType: userAccount.type,
        userStructure: userAccount.structure,
        key: ContextKeyType.CLIENT
      })
    ])

    if (!issuerConfig || !clientConfig) {
      this.logger.error('Config introuvable pour le refresh')
      throw Error('Config introuvable pour le refresh')
    }

    const issuer = new Issuer(JSON.parse(issuerConfig))
    const client = new issuer.Client(JSON.parse(clientConfig))

    const tokenSet = await client.refresh(refreshToken.token)
    const tokenData: TokenData = {
      token: tokenSet.access_token!,
      expiresIn:
        tokenSet.expires_in ??
        this.configService.get<number>(
          'francetravailConseiller.accessTokenMaxAge'
        )!,
      scope: tokenSet.scope
    }

    await this.tokenService.setToken(userAccount, 'access_token', tokenData)

    return tokenData
  }
}
