import { Inject, Injectable, Logger } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { JWKS } from 'oidc-provider'
import { Account } from '../domain/account'
import { User, UserAccount } from '../domain/user'
import { RedisAdapter } from '../redis/redis.adapter'
import { RedisInjectionToken } from '../redis/redis.provider'
import { OIDC_PROVIDER_MODULE, OidcProviderModule, Provider } from './provider'
import {
  TokenExchangeGrant,
  grantType as tokenExchangeGrantType,
  parameters as tokenExchangeParameters
} from './token-exchange.grant'
import { PassEmploiAPIService } from '../pass-emploi-api/pass-emploi-api.service'

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

    this.logger = new Logger('OIDC Service')
    this.logger.log('OIDC Service loading')

    this.oidc = new this.opm.Provider(oidcPort, {
      // the rest of your configuration...

      ttl: {
        RefreshToken: 3600 * 24 * 42,
        Session: 3600 * 24 * 42
      },
      clients: [
        {
          client_id: 'foo',
          client_secret: 'bar',
          redirect_uris: [`${oidcPort}/cb`],
          grant_types: ['authorization_code', tokenExchangeGrantType], //  'implicit'
          response_types: ['code'] // 'code id_token'
        },
        {
          client_id: 'pass-emploi-web',
          client_secret: clients.web.secret,
          redirect_uris: [clients.web.callback],
          grant_types: ['authorization_code'],
          response_types: ['code']
        }
      ],
      enabledJWA: {
        idTokenSigningAlgValues: ['ES384']
      },
      clientDefaults: {
        grant_types: ['authorization_code'],
        id_token_signed_response_alg: 'ES384',
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_basic'
      },
      jwks: this.jwks,
      pkce: {
        required: () => false
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
          this.logger.debug('findAccount context ok')
          user = {
            userId: context.oidc.result.id as string,
            userRoles: context.oidc.result.userRoles as string[],
            userStructure: context.oidc.result.userStructure as User.Structure,
            userType: context.oidc.result.userType as User.Type,
            email: context.oidc.result.email as string,
            family_name: context.oidc.result.family_name as string,
            given_name: context.oidc.result.given_name as string
          }
        }
        // context non présent dans le cas d'un get/post token
        else {
          this.logger.debug('findAccount context undefined')

          const userAccount = Account.fromAccountIdToUserAccount(accountId)
          const apiUser = await this.passemploiapiService.getUser(userAccount)
          if (!apiUser) {
            this.logger.debug('could not get user from API')
            throw new Error('could not get user from API')
          }
          user = apiUser
        }
        return {
          ...user,
          accountId,
          claims: () => ({ sub: accountId.split('|')[2], ...user })
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
          'given_name'
        ]
      },
      extraTokenClaims: (context, _token) => {
        this.logger.log('#### account %j', context.oidc.account)
        this.logger.log('#### claims %j', context.oidc.account?.claims)
        return {
          userId: context.oidc.account?.userId,
          userRoles: context.oidc.account?.userRoles,
          userStructure: context.oidc.account?.userStructure as User.Structure,
          userType: context.oidc.account?.userType as User.Type,
          email: context.oidc.account?.email as string,
          family_name: context.oidc.account?.family_name as string,
          given_name: context.oidc.account?.given_name as string
        }
      },
      features: {
        devInteractions: { enabled: false }, // change this to false to disable the dev interactions
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
        }
      },
      interactions: {
        url(ctx, interaction) {
          if (!ctx.request.query.kc_idp_hint) {
            return `/choice/${interaction.uid}`
          }

          const connector = `${ctx.request.query.kc_idp_hint}`

          switch (connector) {
            case 'similo-jeune':
              return `/milo-jeune/connect/${interaction.uid}`
            case 'similo-conseiller':
              return `/milo-conseiller/connect/${interaction.uid}`
            case 'pe-jeune':
              return `/francetravail-jeune/connect/${interaction.uid}`
            case 'pe-brsa-jeune':
              return `/francetravail-brsa/connect/${interaction.uid}`
            case 'pe-conseiller':
              return `/francetravail-conseiller/connect/${interaction.uid}`
            case 'pe-brsa-conseiller':
              return `/francetravail-conseiller/connect/${interaction.uid}`
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

  createGrant(accountId: string) {
    const grant = new this.oidc.Grant({
      accountId,
      clientId: 'pass-emploi-web'
    })
    return grant
  }

  findGrant(grantId: string) {
    return this.oidc.Grant.find(grantId)
  }
}
