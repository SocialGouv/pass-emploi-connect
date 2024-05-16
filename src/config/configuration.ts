/* eslint-disable */
import * as Joi from 'joi'
import { configurationSchema } from './configuration.schema'

type ClientIdentifier = 'web' | 'app' | 'api' | 'swagger'
type Client = Record<ClientIdentifier, unknown>
export enum IdpConfigIdentifier {
  MILO_CONSEILLER = 'miloConseiller',
  MILO_JEUNE = 'miloJeune',
  FT_CONSEILLER = 'francetravailConseiller',
  FT_JEUNE = 'francetravailJeune'
}
export interface IdpConfig {
  issuer: string
  realm?: string
  authorizationUrl: string
  tokenUrl: string
  jwks: string
  userinfo: string
  clientId: string
  clientSecret: string
  scopes: string
  redirectUri: string
  logout: string
  accessTokenMaxAge: number
  refreshTokenMaxAge: number
}
type Idp = Record<IdpConfigIdentifier, IdpConfig>

interface Configuration {
  clients: Client
  idps: Idp
  [key: string]: unknown
}

const IDP_FT_CONSEILLER_ACCESS_TOKEN_MAX_AGE = 1800
const IDP_FT_CONSEILLER_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 42
const IDP_FT_JEUNE_ACCESS_TOKEN_MAX_AGE = 1800
const IDP_FT_JEUNE_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 42
const IDP_MILO_CONSEILLER_ACCESS_TOKEN_MAX_AGE = 300
const IDP_MILO_CONSEILLER_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 30
const IDP_MILO_JEUNE_ACCESS_TOKEN_MAX_AGE = 300
const IDP_MILO_JEUNE_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 30

export default () => {
  const configuration: Configuration = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5050,
    publicAddress:
      process.env.PUBLIC_ADDRESS ||
      `http://localhost:${process.env.PORT ? parseInt(process.env.PORT, 10) : 5050}`,
    passemploiapi: {
      url: process.env.PASS_EMPLOI_API_URL,
      key: process.env.PASS_EMPLOI_API_KEY
    },
    redis: {
      url: process.env.REDIS_URL
    },
    clients: {
      web: {
        id: process.env.CLIENT_WEB_ID,
        secret: process.env.CLIENT_WEB_SECRET,
        callbacks: JSON.parse(process.env.CLIENT_WEB_CALLBACKS!),
        logoutCallbacks: JSON.parse(process.env.CLIENT_WEB_LOGOUT_CALLBACKS!)
      },
      app: {
        id: process.env.CLIENT_APP_ID,
        secret: process.env.CLIENT_APP_SECRET,
        callbacks: JSON.parse(process.env.CLIENT_APP_CALLBACKS!)
      },
      api: {
        id: process.env.CLIENT_API_ID,
        secret: process.env.CLIENT_API_SECRET
      },
      swagger: {
        id: process.env.CLIENT_SWAGGER_ID,
        secret: process.env.CLIENT_SWAGGER_SECRET,
        callbacks: JSON.parse(process.env.CLIENT_SWAGGER_CALLBACKS!)
      }
    },
    ressourceServer: {
      url: process.env.RESSOURCE_SERVER,
      scopes: process.env.RESSOURCE_SCOPES
    },
    jwks: JSON.parse(process.env.JWKS!),
    idps: {
      francetravailJeune: {
        issuer: process.env.IDP_FT_JEUNE_ISSUER!,
        realm: process.env.IDP_FT_JEUNE_REALM!,
        authorizationUrl: process.env.IDP_FT_JEUNE_AUTHORIZATION_URL!,
        tokenUrl: process.env.IDP_FT_JEUNE_TOKEN_URL!,
        jwks: process.env.IDP_FT_JEUNE_JWKS!,
        userinfo: process.env.IDP_FT_JEUNE_USERINFO!,
        clientId: process.env.IDP_FT_JEUNE_CLIENT_ID!,
        clientSecret: process.env.IDP_FT_JEUNE_CLIENT_SECRET!,
        scopes: process.env.IDP_FT_JEUNE_SCOPES!,
        redirectUri: process.env.IDP_FT_JEUNE_REDIRECT_URI!,
        logout: process.env.IDP_FT_JEUNE_LOGOUT!,
        accessTokenMaxAge:
          Number(process.env.IDP_FT_JEUNE_ACCESS_TOKEN_MAX_AGE) ||
          IDP_FT_JEUNE_ACCESS_TOKEN_MAX_AGE,
        refreshTokenMaxAge:
          Number(process.env.IDP_FT_JEUNE_REFRESH_TOKEN_MAX_AGE) ||
          IDP_FT_JEUNE_REFRESH_TOKEN_MAX_AGE
      },
      francetravailConseiller: {
        issuer: process.env.IDP_FT_CONSEILLER_ISSUER!,
        realm: process.env.IDP_FT_CONSEILLER_REALM!,
        authorizationUrl: process.env.IDP_FT_CONSEILLER_AUTHORIZATION_URL!,
        tokenUrl: process.env.IDP_FT_CONSEILLER_TOKEN_URL!,
        jwks: process.env.IDP_FT_CONSEILLER_JWKS!,
        userinfo: process.env.IDP_FT_CONSEILLER_USERINFO!,
        clientId: process.env.IDP_FT_CONSEILLER_CLIENT_ID!,
        clientSecret: process.env.IDP_FT_CONSEILLER_CLIENT_SECRET!,
        scopes: process.env.IDP_FT_CONSEILLER_SCOPES!,
        redirectUri: process.env.IDP_FT_CONSEILLER_REDIRECT_URI!,
        logout: process.env.IDP_FT_CONSEILLER_LOGOUT!,
        accessTokenMaxAge:
          Number(process.env.IDP_FT_CONSEILLER_ACCESS_TOKEN_MAX_AGE) ||
          IDP_FT_CONSEILLER_ACCESS_TOKEN_MAX_AGE,
        refreshTokenMaxAge:
          Number(process.env.IDP_FT_CONSEILLER_REFRESH_TOKEN_MAX_AGE) ||
          IDP_FT_CONSEILLER_REFRESH_TOKEN_MAX_AGE
      },
      miloConseiller: {
        issuer: process.env.IDP_MILO_CONSEILLER_ISSUER!,
        authorizationUrl: process.env.IDP_MILO_CONSEILLER_AUTHORIZATION_URL!,
        tokenUrl: process.env.IDP_MILO_CONSEILLER_TOKEN_URL!,
        jwks: process.env.IDP_MILO_CONSEILLER_JWKS!,
        userinfo: process.env.IDP_MILO_CONSEILLER_USERINFO!,
        clientId: process.env.IDP_MILO_CONSEILLER_CLIENT_ID!,
        clientSecret: process.env.IDP_MILO_CONSEILLER_CLIENT_SECRET!,
        scopes: process.env.IDP_MILO_CONSEILLER_SCOPES!,
        redirectUri: process.env.IDP_MILO_CONSEILLER_REDIRECT_URI!,
        logout: process.env.IDP_MILO_CONSEILLER_LOGOUT!,
        accessTokenMaxAge:
          Number(process.env.IDP_MILO_CONSEILLER_ACCESS_TOKEN_MAX_AGE) ||
          IDP_MILO_CONSEILLER_ACCESS_TOKEN_MAX_AGE,
        refreshTokenMaxAge:
          Number(process.env.IDP_MILO_CONSEILLER_REFRESH_TOKEN_MAX_AGE) ||
          IDP_MILO_CONSEILLER_REFRESH_TOKEN_MAX_AGE
      },
      miloJeune: {
        issuer: process.env.IDP_MILO_JEUNE_ISSUER!,
        authorizationUrl: process.env.IDP_MILO_JEUNE_AUTHORIZATION_URL!,
        tokenUrl: process.env.IDP_MILO_JEUNE_TOKEN_URL!,
        jwks: process.env.IDP_MILO_JEUNE_JWKS!,
        userinfo: process.env.IDP_MILO_JEUNE_USERINFO!,
        clientId: process.env.IDP_MILO_JEUNE_CLIENT_ID!,
        clientSecret: process.env.IDP_MILO_JEUNE_CLIENT_SECRET!,
        scopes: process.env.IDP_MILO_JEUNE_SCOPES!,
        redirectUri: process.env.IDP_MILO_JEUNE_REDIRECT_URI!,
        logout: process.env.IDP_MILO_JEUNE_LOGOUT!,
        accessTokenMaxAge:
          Number(process.env.IDP_MILO_JEUNE_ACCESS_TOKEN_MAX_AGE) ||
          IDP_MILO_JEUNE_ACCESS_TOKEN_MAX_AGE,
        refreshTokenMaxAge:
          Number(process.env.IDP_MILO_JEUNE_REFRESH_TOKEN_MAX_AGE) ||
          IDP_MILO_JEUNE_REFRESH_TOKEN_MAX_AGE
      }
    }
  }

  return Joi.attempt(configuration, configurationSchema)
}
