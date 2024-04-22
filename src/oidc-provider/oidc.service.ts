import { Inject, Injectable, Logger } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { JWKS } from 'oidc-provider'
import { Account } from '../domain/account'
import { User } from '../domain/user'
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
    private readonly tokenExchangeGrant: TokenExchangeGrant
  ) {
    const oidcPort = this.configService.get<string>('publicAddress')!
    const clients = this.configService.get('clients')
    this.jwks = this.configService.get<JWKS>('jwks')!

    this.logger = new Logger('OIDC Service')
    this.logger.log('OIDC Service loading')

    this.oidc = new this.opm.Provider(oidcPort, {
      // the rest of your configuration...

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
        // authorization_signed_response_alg: 'ES384',
        // token_endpoint_auth_signing_alg: 'ES384',
        // userinfo_signed_response_alg: 'ES384',
        // request_object_signing_alg: 'ES384',
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
      findAccount: (context, accountId: string) => {
        // TODO faire un appel d'API pour récupérer les infos sauf si context.oidc.result est présent
        this.logger.log('#### FIND ACC CTX RESULT %j', context.oidc.result)

        const userIds: Record<User.Structure, string> = {
          MILO: '20097302-448d-4048-a0ae-306964aab60e',
          POLE_EMPLOI: 'cbf8fb13-8438-4981-8bbd-d74fbfb71fda',
          POLE_EMPLOI_BRSA: '401f0f85-c678-49b6-996a-f9759136d43b'
        }
        let user: User
        if (context.oidc.result) {
          user = {
            userId:
              userIds[context.oidc.result.userStructure as User.Structure],
            userRoles: [],
            userStructure: context.oidc.result.userStructure as User.Structure,
            userType: context.oidc.result.userType as User.Type,
            email: context.oidc.result.email as string,
            family_name: context.oidc.result.family_name as string,
            given_name: context.oidc.result.given_name as string
          }
        } else {
          user = {
            userId: userIds[Account.getStructureFromAccountId(accountId)],
            userRoles: [],
            userStructure: Account.getStructureFromAccountId(accountId),
            userType: Account.getTypeFromAccountId(accountId),
            email: 'jopa@octo.com',
            family_name: 'Page',
            given_name: 'Joseph'
          }
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
        // claimsParameter: { enabled: true },
        devInteractions: { enabled: false }, // change this to false to disable the dev interactions
        userinfo: { enabled: true },
        resourceIndicators: {
          enabled: true,
          defaultResource: () => this.configService.get('ressourceServer.url')!,
          useGrantedResource: () => true,
          getResourceServerInfo: () => ({
            scope: this.configService.get('ressourceServer.scopes')!,
            accessTokenFormat: 'jwt'
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

    // TODO inject tokenStore
    // const tokenExchangeHandler = tokenExchangeHandlerFactory({
    //   tokenStore:
    // })

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
