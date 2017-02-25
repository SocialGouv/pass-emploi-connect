/* eslint-disable */
import * as Joi from 'joi'
import { configurationSchema } from './configuration.schema'

export default () => {
  const configuration = {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5050,
    publicAddress:
      process.env.PUBLIC_ADDRESS ||
      `http://localhost:${process.env.PORT ? parseInt(process.env.PORT, 10) : 5050}`,
    redis: {
      url: process.env.REDIS_URL
    },
    clients: {
      web: {
        secret: process.env.CLIENT_WEB_SECRET
      }
    },
    ressourceServer: {
      url: process.env.RESSOURCE_SERVER,
      scopes: process.env.RESSOURCE_SCOPES
    },
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
      redirectUri: process.env.IDP_FT_JEUNE_REDIRECT_URI
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
      redirectUri: process.env.IDP_FT_CONSEILLER_REDIRECT_URI
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
      redirectUri: process.env.IDP_MILO_CONSEILLER_REDIRECT_URI
    }
  }

  return Joi.attempt(configuration, configurationSchema)
}
