import { Inject, Injectable, Logger } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { ErrorOut, JWKS } from 'oidc-provider'
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
import * as sanitizeHtml from 'sanitize-html'
import { isFailure } from '../result/result'

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
          client_secret: clients.swagger.secret,
          redirect_uris: clients.swagger.callbacks,
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          token_endpoint_auth_method: 'client_secret_post'
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
      renderError: (ctx, out, _error) => {
        ctx.type = 'html'
        ctx.body = `<!DOCTYPE html>
        <html>
        
        <head>
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta charset="utf-8">
          <title>Portail de connexion</title>
          <style>
            @import url(https://fonts.googleapis.com/css?family=Roboto:400,100);
        
            body {
              background-color: #f7f7ff;
              font-family: Roboto, sans-serif;
              margin-top: 100px;
              margin-bottom: 25px
            }
        
            .container {
              background-color: #f9ffff;
              width: 60vw;
              text-align: center;
              padding: 5px;
              margin: 0 auto;
              border-radius: 10px;
              box-shadow: 0 0 10px rgb(59, 105, 209, 0.3);
            }
        
            h1 {
              font-weight: 1000;
              color: rgb(59, 105, 209);
              text-align: center;
              font-size: 2.3em;
              padding: 50px;
            }
        
            .footer-text {
              margin-top: 50px;
              color: rgb(126, 126, 130);
            }
        
            a {
              color: inherit;
            }
        
            pre {
              white-space: pre-wrap;
              white-space: -moz-pre-wrap;
              white-space: -pre-wrap;
              white-space: -o-pre-wrap;
              word-wrap: break-word;
              margin: 0 0 0 1em;
              text-indent: -1em
            }
          </style>
        </head>
        
        <body>
          <div class="container">
            <h1>Portail de connexion</h1>
            <p>Une erreur technique s'est produite</p>
            ${this.logErrors(out)}
            <p class="footer-text"><a
                href="mailto:support@pass-emploi.beta.gouv.fr?subject=Erreur technique lors de la connexion">Contacter le
                support</a></p>
          </div>
        </body>
        
        </html>`
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
          if (isFailure(apiUser)) {
            this.logger.error('Could not get user from API')
            throw new Error('Could not get user from API')
          }
          user = apiUser.data
          throw new Error('Could not get user from API')
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
            ctx.body = `<html>

            <head>
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta charset="utf-8">
              <title>Portail de connexion</title>
              <style>
                @import url(https://fonts.googleapis.com/css?family=Roboto:400,100);
            
                body {
                  background-color: #f7f7ff;
                  font-family: Roboto, sans-serif;
                  margin-top: 100px;
                  margin-bottom: 25px;
                  text-align: center
                }
            
                .container {
                  width: 40vw;
                  padding: 5px;
                  margin: 0 auto;
                }
            
                button {
                  border: none;
                  outline: none;
                  color: rgb(59, 105, 209);
                  font-size: 14px;
                  font-weight: 700;
                  padding: 10px;
                  width: 100%;
                  border-radius: 10px;
                  background-color: #ffffff;
                }
            
                button:hover {
                  background-color: rgb(59, 105, 209);
                  color: white;
                }
              </style>
            </head>
            
            <body>
              <div class="container">
                ${form}
                <button autofocus type="submit" form="op.logoutForm" value="yes" name="logout">Déconnexion...</button>
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

  private logErrors(errors: ErrorOut): string {
    this.logger.error(errors)
    if (this.configService.get('environment') !== 'prod') {
      return Object.entries(errors)
        .map(
          ([key, value]) =>
            `<pre><strong>${key}</strong>: ${sanitizeHtml(value)}</pre>`
        )
        .join('')
    }
    return '<p>Veuillez réessayer plus tard</p>'
  }
}
