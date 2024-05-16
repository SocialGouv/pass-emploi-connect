import { Inject, Injectable, Logger } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { JWKS } from 'oidc-provider'
import { Account } from '../domain/account'
import { User } from '../domain/user'
import { PassEmploiAPIService } from '../pass-emploi-api/pass-emploi-api.service'
import { RedisAdapter } from '../redis/redis.adapter'
import { RedisInjectionToken } from '../redis/redis.provider'
import { OIDC_PROVIDER_MODULE, OidcProviderModule, Provider } from './provider'
import {
  TokenExchangeGrant,
  grantType as tokenExchangeGrantType,
  parameters as tokenExchangeParameters
} from './token-exchange.grant'

@Injectable()
export class OidcService {
  private readonly logger: Logger
  private readonly oidc: Provider
  private readonly jwks: JWKS

  constructor(
    private configService: ConfigService,
    @Inject(OIDC_PROVIDER_MODULE) private readonly opm: OidcProviderModule,
    @Inject(RedisInjectionToken) private readonly redisClient: Redis,
    private readonly tokenExchangeGrant: TokenExchangeGrant,
    private readonly passemploiapiService: PassEmploiAPIService
  ) {
    const oidcPort = this.configService.get<string>('publicAddress')!
    const clients = this.configService.get('clients')
    this.jwks = this.configService.get<JWKS>('jwks')!

    this.logger = new Logger('OidcService')

    this.oidc = new this.opm.Provider(oidcPort, {
      routes: {
        authorization: '/protocol/openid-connect/auth',
        backchannel_authentication: '/protocol/openid-connect/ext/ciba/auth',
        device_authorization: '/protocol/openid-connect/auth/device',
        end_session: '/protocol/openid-connect/logout',
        introspection: '/protocol/openid-connect/token/introspection',
        jwks: '/protocol/openid-connect/certs',
        pushed_authorization_request:
          '/protocol/openid-connect/ext/par/request',
        registration: '/clients-registrations/openid-connect',
        revocation: '/protocol/openid-connect/revoke',
        token: '/protocol/openid-connect/token',
        userinfo: '/protocol/openid-connect/userinfo'
      },
      ttl: {
        RefreshToken: 3600 * 24 * 42,
        Session: 3600 * 24 * 42
      },
      issueRefreshToken: async function issueRefreshToken(_ctx, client, _code) {
        return client.grantTypeAllowed('refresh_token')
      },
      extraParams: ['kc_idp_hint'],
      clients: [
        {
          client_id: clients.api.id,
          client_secret: clients.api.secret,
          grant_types: [tokenExchangeGrantType],
          response_types: []
        },
        {
          client_id: clients.web.id,
          client_secret: clients.web.secret,
          redirect_uris: clients.web.callbacks,
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          token_endpoint_auth_method: 'client_secret_basic',
          post_logout_redirect_uris: clients.web.logoutCallbacks
        },
        {
          client_id: clients.app.id,
          client_secret: clients.app.secret,
          application_type: 'native',
          redirect_uris: clients.app.callbacks,
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          token_endpoint_auth_method: 'client_secret_basic'
        },
        {
          client_id: clients.swagger.id,
          client_secret: 'jopa',
          redirect_uris: clients.swagger.callbacks,
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          token_endpoint_auth_method: 'none'
        }
      ],
      // si besoin de changer l'algo des jwks
      // enabledJWA: {
      //   idTokenSigningAlgValues: ['ES384']
      // },
      // clientDefaults: {
      //   id_token_signed_response_alg: 'ES384',
      // },
      jwks: this.jwks,
      pkce: {
        required: () => false,
        methods: ['S256', 'plain']
      },
      cookies: {
        keys: ['my-secret-key'],
        short: { path: '/' }
      },
      adapter: (name: string) => new RedisAdapter(name, this.redisClient),
      findAccount: async (context, accountId: string) => {
        let user: User

        // présent uniquement dans le cas d'un authorize
        if (context.oidc.result) {
          user = {
            userId: context.oidc.result.id as string,
            userRoles: context.oidc.result.userRoles as string[],
            userStructure: context.oidc.result.userStructure as User.Structure,
            userType: context.oidc.result.userType as User.Type,
            email: context.oidc.result.email as string,
            family_name: context.oidc.result.family_name as string,
            given_name: context.oidc.result.given_name as string,
            preferred_username: context.oidc.result.preferred_username as string
          }
        }
        // context non présent dans le cas d'un get/post token
        else {
          const userAccount = Account.fromAccountIdToUserAccount(accountId)
          const apiUser = await this.passemploiapiService.getUser(userAccount)
          if (!apiUser) {
            this.logger.debug('Could not get user from API')
            throw new Error('Could not get user from API')
          }
          user = apiUser
        }
        return {
          ...user,
          accountId,
          claims: () => ({
            ...user,
            sub: Account.getSubFromAccountId(accountId)
          })
        }
      },
      claims: {
        openid: ['sub'],
        email: ['email'],
        profile: [
          'userId',
          'userRoles',
          'userStructure',
          'userType',
          'family_name',
          'given_name',
          'preferred_username'
        ]
      },
      extraTokenClaims: (context, _token) => {
        return {
          userId: context.oidc.account?.userId,
          userRoles: context.oidc.account?.userRoles,
          userStructure: context.oidc.account?.userStructure,
          userType: context.oidc.account?.userType,
          email: context.oidc.account?.email,
          family_name: context.oidc.account?.family_name,
          given_name: context.oidc.account?.given_name,
          preferred_username: context.oidc.account?.preferred_username
        }
      },
      features: {
        devInteractions: { enabled: false },
        userinfo: { enabled: true },
        resourceIndicators: {
          enabled: true,
          defaultResource: () => this.configService.get('ressourceServer.url')!,
          useGrantedResource: () => true,
          getResourceServerInfo: () => ({
            scope: this.configService.get('ressourceServer.scopes')!,
            accessTokenFormat: 'jwt',
            accessTokenTTL: 30 * 60
          })
        },
        rpInitiatedLogout: {
          enabled: true,
          logoutSource: async function logoutSource(ctx: any, form: any) {
            // @param ctx - koa request context
            // @param form - form source (id=""op.logoutForm"") to be embedded in the page and submitted by
            //   the End-User
            ctx.body = `<!DOCTYPE html>
              <html>
                <head>
                  <meta http-equiv="X-UA-Compatible" content="IE=edge">
                  <meta charset="utf-8">
                  <title>Logout Request</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
                  <style>
                    @import url(https://fonts.googleapis.com/css?family=Roboto:400,100);button,h1{text-align:center}h1{font-weight:100;font-size:1.3em}body{font-family:Roboto,sans-serif;margin-top:25px;margin-bottom:25px}.container{padding:0 40px 10px;width:274px;background-color:#F7F7F7;margin:0 auto 10px;border-radius:2px;box-shadow:0 2px 2px rgba(0,0,0,.3);overflow:hidden}button{font-size:14px;font-family:Arial,sans-serif;font-weight:700;height:36px;padding:0 8px;width:100%;display:block;margin-bottom:10px;position:relative;border:0;color:#fff;text-shadow:0 1px rgba(0,0,0,.1);background-color:#4d90fe;cursor:pointer}button:hover{border:0;text-shadow:0 1px rgba(0,0,0,.3);background-color:#357ae8}
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>Voulez-vous vraiment vous déconnecter ?</h1>
                    ${form}
                    <button autofocus type="submit" form="op.logoutForm" value="yes" name="logout">Oui, me déconnecter</button>
                    <button type="submit" form="op.logoutForm">Non, rester connecté</button>
                  </div>
                  <script type="text/javascript">
                    document.querySelector('form[id="op.logoutForm"]').submit();
                  </script>
                </body>
              </html>`
          }
        }
      },
      interactions: {
        async url(ctx, interaction) {
          if (ctx.request.query.kc_idp_hint) {
            interaction.params.kc_idp_hint = ctx.request.query.kc_idp_hint
            await interaction.persist()
          }

          if (!interaction.params.kc_idp_hint) {
            return `/choice/${interaction.uid}`
          }

          const connector = `${interaction.params.kc_idp_hint}`

          switch (connector) {
            case 'similo-jeune':
              return `/milo-jeune/connect/${interaction.uid}`
            case 'similo-conseiller':
              return `/milo-conseiller/connect/${interaction.uid}`
            case 'pe-jeune':
              return `/francetravail-jeune/connect/${interaction.uid}?type=cej`
            case 'pe-brsa-jeune':
              return `/francetravail-jeune/connect/${interaction.uid}?type=brsa`
            case 'pe-aij-jeune':
              return `/francetravail-jeune/connect/${interaction.uid}?type=aij`
            case 'pe-conseiller':
              return `/francetravail-conseiller/connect/${interaction.uid}?type=cej`
            case 'pe-brsa-conseiller':
              return `/francetravail-conseiller/connect/${interaction.uid}?type=brsa`
            case 'pe-aij-conseiller':
              return `/francetravail-conseiller/connect/${interaction.uid}?type=aij`
            default:
              return `/choice/${interaction.uid}`
          }
        }
      }
    })

    this.oidc.registerGrantType(
      tokenExchangeGrantType,
      this.tokenExchangeGrant.handler,
      tokenExchangeParameters
    )
    this.oidc.proxy = true
  }

  // Below are the methods that you can use to interact with the oidc-provider library

  callback: Provider['callback'] = () => {
    try {
      return this.oidc.callback()
    } catch (e) {
      this.logger.error(e)
      throw e
    }
  }

  interactionDetails: Provider['interactionDetails'] = (req, res) => {
    return this.oidc.interactionDetails(req, res)
  }

  interactionFinished: Provider['interactionFinished'] = (req, res, result) => {
    return this.oidc.interactionFinished(req, res, result)
  }

  interactionResult: Provider['interactionResult'] = (req, res, result) => {
    return this.oidc.interactionResult(req, res, result)
  }

  getProvider(): Provider {
    return this.oidc
  }

  createGrant(accountId: string, clientId: string) {
    const grant = new this.oidc.Grant({
      accountId,
      clientId
    })
    return grant
  }

  findGrant(grantId: string) {
    return this.oidc.Grant.find(grantId)
  }
}
