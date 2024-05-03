/* eslint-disable */
import * as Joi from 'joi'
import { configurationSchema } from './configuration.schema'

const IDP_FT_CONSEILLER_ACCESS_TOKEN_MAX_AGE = 1800
const IDP_FT_CONSEILLER_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 42
const IDP_FT_JEUNE_ACCESS_TOKEN_MAX_AGE = 1800
const IDP_FT_JEUNE_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 42
const IDP_MILO_CONSEILLER_ACCESS_TOKEN_MAX_AGE = 300
const IDP_MILO_CONSEILLER_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 30
const IDP_MILO_JEUNE_ACCESS_TOKEN_MAX_AGE = 300
const IDP_MILO_JEUNE_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 30

export default () => {
  const configuration = {
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
        secret: process.env.CLIENT_WEB_SECRET,
        callback: process.env.CLIENT_WEB_CALLBACK
      }
    },
    ressourceServer: {
      url: process.env.RESSOURCE_SERVER,
      scopes: process.env.RESSOURCE_SCOPES
    },
    jwks: JSON.parse(process.env.JWKS!),
    francetravailJeune: {
      issuer: process.env.IDP_FT_JEUNE_ISSUER,
      realm: process.env.IDP_FT_JEUNE_REALM,
      authorizationUrl: process.env.IDP_FT_JEUNE_AUTHORIZATION_URL,
      tokenUrl: process.env.IDP_FT_JEUNE_TOKEN_URL,
      jwks: process.env.IDP_FT_JEUNE_JWKS,
      userinfo: process.env.IDP_FT_JEUNE_USERINFO,
      clientId: process.env.IDP_FT_JEUNE_CLIENT_ID,
      clientSecret: process.env.IDP_FT_JEUNE_CLIENT_SECRET,
      scopes: process.env.IDP_FT_JEUNE_SCOPES,
      redirectUri: process.env.IDP_FT_JEUNE_REDIRECT_URI,
      accessTokenMaxAge:
        process.env.IDP_FT_JEUNE_ACCESS_TOKEN_MAX_AGE ||
        IDP_FT_JEUNE_ACCESS_TOKEN_MAX_AGE,
      refreshTokenMaxAge:
        process.env.IDP_FT_JEUNE_ACCESS_TOKEN_MAX_AGE ||
        IDP_FT_JEUNE_REFRESH_TOKEN_MAX_AGE
    },
    francetravailConseiller: {
      issuer: process.env.IDP_FT_CONSEILLER_ISSUER,
      realm: process.env.IDP_FT_CONSEILLER_REALM,
      authorizationUrl: process.env.IDP_FT_CONSEILLER_AUTHORIZATION_URL,
      tokenUrl: process.env.IDP_FT_CONSEILLER_TOKEN_URL,
      jwks: process.env.IDP_FT_CONSEILLER_JWKS,
      userinfo: process.env.IDP_FT_CONSEILLER_USERINFO,
      clientId: process.env.IDP_FT_CONSEILLER_CLIENT_ID,
      clientSecret: process.env.IDP_FT_CONSEILLER_CLIENT_SECRET,
      scopes: process.env.IDP_FT_CONSEILLER_SCOPES,
      redirectUri: process.env.IDP_FT_CONSEILLER_REDIRECT_URI,
      accessTokenMaxAge:
        process.env.IDP_FT_CONSEILLER_ACCESS_TOKEN_MAX_AGE ||
        IDP_FT_CONSEILLER_ACCESS_TOKEN_MAX_AGE,
      refreshTokenMaxAge:
        process.env.IDP_FT_CONSEILLER_ACCESS_TOKEN_MAX_AGE ||
        IDP_FT_CONSEILLER_REFRESH_TOKEN_MAX_AGE
    },
    miloConseiller: {
      issuer: process.env.IDP_MILO_CONSEILLER_ISSUER,
      authorizationUrl: process.env.IDP_MILO_CONSEILLER_AUTHORIZATION_URL,
      tokenUrl: process.env.IDP_MILO_CONSEILLER_TOKEN_URL,
      jwks: process.env.IDP_MILO_CONSEILLER_JWKS,
      userinfo: process.env.IDP_MILO_CONSEILLER_USERINFO,
      clientId: process.env.IDP_MILO_CONSEILLER_CLIENT_ID,
      clientSecret: process.env.IDP_MILO_CONSEILLER_CLIENT_SECRET,
      scopes: process.env.IDP_MILO_CONSEILLER_SCOPES,
      redirectUri: process.env.IDP_MILO_CONSEILLER_REDIRECT_URI,
      accessTokenMaxAge:
        process.env.IDP_MILO_CONSEILLER_ACCESS_TOKEN_MAX_AGE ||
        IDP_MILO_CONSEILLER_ACCESS_TOKEN_MAX_AGE,
      refreshTokenMaxAge:
        process.env.IDP_MILO_CONSEILLER_ACCESS_TOKEN_MAX_AGE ||
        IDP_MILO_CONSEILLER_REFRESH_TOKEN_MAX_AGE
    },
    miloJeune: {
      issuer: process.env.IDP_MILO_JEUNE_ISSUER,
      authorizationUrl: process.env.IDP_MILO_JEUNE_AUTHORIZATION_URL,
      tokenUrl: process.env.IDP_MILO_JEUNE_TOKEN_URL,
      jwks: process.env.IDP_MILO_JEUNE_JWKS,
      userinfo: process.env.IDP_MILO_JEUNE_USERINFO,
      clientId: process.env.IDP_MILO_JEUNE_CLIENT_ID,
      clientSecret: process.env.IDP_MILO_JEUNE_CLIENT_SECRET,
      scopes: process.env.IDP_MILO_JEUNE_SCOPES,
      redirectUri: process.env.IDP_MILO_JEUNE_REDIRECT_URI,
      accessTokenMaxAge:
        process.env.IDP_MILO_JEUNE_ACCESS_TOKEN_MAX_AGE ||
        IDP_MILO_JEUNE_ACCESS_TOKEN_MAX_AGE,
      refreshTokenMaxAge:
        process.env.IDP_MILO_JEUNE_ACCESS_TOKEN_MAX_AGE ||
        IDP_MILO_JEUNE_REFRESH_TOKEN_MAX_AGE
    }
  }

  return Joi.attempt(configuration, configurationSchema)
}
