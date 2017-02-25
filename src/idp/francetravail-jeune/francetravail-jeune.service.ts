import { Injectable, Logger } from '@nestjs/common'
import { BaseClient, Issuer } from 'openid-client'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'

@Injectable()
export class FrancetravailJeuneService {
  issuer: Issuer<BaseClient>
  private logger: Logger
  private client: BaseClient

  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger('FrancetravailJeuneService')

    const issuer = this.configService.get<string>('francetravailJeune.issuer')!
    const authorizationUrl = this.configService.get<string>(
      'francetravailJeune.authorizationUrl'
    )!
    const tokenUrl = this.configService.get<string>(
      'francetravailJeune.tokenUrl'
    )!
    const jwks = this.configService.get<string>('francetravailJeune.jwks')!
    const userinfo = this.configService.get<string>(
      'francetravailJeune.userinfo'
    )!
    const clientId = this.configService.get<string>(
      'francetravailJeune.clientId'
    )!
    const clientSecret = this.configService.get<string>(
      'francetravailJeune.clientSecret'
    )!
    const scopes = this.configService.get<string>('francetravailJeune.scopes')!
    const redirectUri = this.configService.get<string>(
      'francetravailJeune.redirectUri'
    )!

    // discover possible sur cette URL mais tout est en intra : /connexion/oauth2/.well-known/openid-configuration

    this.issuer = new Issuer({
      issuer,
      authorization_endpoint: authorizationUrl,
      token_endpoint: tokenUrl,
      jwks_uri: jwks,
      userinfo_endpoint: userinfo
    })
    this.client = new this.issuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [redirectUri],
      response_types: ['code'],
      scope: scopes,
      token_endpoint_auth_method: 'client_secret_post'
    })
  }

  async getAuthorizationUrl(interactionId: string) {
    const scopes = this.configService.get<string>('francetravailJeune.scopes')!
    const realm = this.configService.get<string>('francetravailJeune.realm')!

    const authorizationUrl = this.client.authorizationUrl({
      nonce: interactionId,
      scope: scopes,
      realm: realm
    })
    this.logger.debug(authorizationUrl)
    return authorizationUrl
  }

  async callback(request: Request, nonce: string) {
    const realm = this.configService.get<string>('francetravailJeune.realm')!
    const redirectUri = this.configService.get<string>(
      'francetravailJeune.redirectUri'
    )!

    this.logger.debug('GET CB PARAMS')
    const params = this.client.callbackParams(request)

    this.logger.debug(`NONNNNNNCE ${nonce}`)

    this.logger.debug('params callback: %j', params)
    const tokenSet = await this.client.callback(redirectUri, params, { nonce })

    this.logger.debug('received and validated tokens %j', tokenSet)
    this.logger.debug('validated ID Token claims %j', tokenSet.claims())

    const userInfo = await this.client.userinfo(tokenSet, {
      params: { realm }
    })

    this.logger.debug(JSON.stringify(userInfo))
    return { tokenSet, userInfo }
  }
}
