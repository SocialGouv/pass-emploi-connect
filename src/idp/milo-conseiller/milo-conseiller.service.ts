import { Injectable, Logger } from '@nestjs/common'
import { BaseClient, Issuer } from 'openid-client'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { Context } from '../../context/context.provider'

@Injectable()
export class MiloConseillerService {
  issuer: Issuer<BaseClient>
  private logger: Logger
  private client: BaseClient

  constructor(
    private readonly configService: ConfigService
    //private readonly context: Context
  ) {
    this.logger = new Logger('MiloConseillerService')
    //this.context.start()

    const issuer = this.configService.get<string>('miloConseiller.issuer')!
    const authorizationUrl = this.configService.get<string>(
      'miloConseiller.authorizationUrl'
    )!
    const tokenUrl = this.configService.get<string>('miloConseiller.tokenUrl')!
    const jwks = this.configService.get<string>('miloConseiller.jwks')!
    const userinfo = this.configService.get<string>('miloConseiller.userinfo')!
    const clientId = this.configService.get<string>('miloConseiller.clientId')!
    const clientSecret = this.configService.get<string>(
      'miloConseiller.clientSecret'
    )!
    const scopes = this.configService.get<string>('miloConseiller.scopes')!
    const redirectUri = this.configService.get<string>(
      'miloConseiller.redirectUri'
    )!

    // discover possible sur cette URL mais tout est en intra : /connexion/oauth2/.well-known/openid-configuration?realm=/agent

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
    const scopes = this.configService.get<string>('miloConseiller.scopes')!

    const authorizationUrl = this.client.authorizationUrl({
      nonce: interactionId,
      scope: scopes
    })
    this.logger.debug(authorizationUrl)
    return authorizationUrl
  }

  async callback(request: Request, nonce: string) {
    const redirectUri = this.configService.get<string>(
      'miloConseiller.redirectUri'
    )!

    this.logger.debug('GET CB PARAMS')
    const params = this.client.callbackParams(request)

    this.logger.debug(`NONNNNNNCE ${nonce}`)

    this.logger.debug('params callback: %j', params)
    const tokenSet = await this.client.callback(redirectUri, params, { nonce })

    this.logger.debug('received and validated tokens %j', tokenSet)
    this.logger.debug('validated ID Token claims %j', tokenSet.claims())

    const userInfo = await this.client.userinfo(tokenSet)

    this.logger.log('#### USER INFO %j', userInfo)
    return { tokenSet, userInfo }
  }
}
