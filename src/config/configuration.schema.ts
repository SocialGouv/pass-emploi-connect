import * as Joi from 'joi'

export const configurationSchema = Joi.object({
  port: Joi.number(),
  publicAddress: Joi.string().required(),
  redis: Joi.object({
    url: Joi.string().required()
  }).required(),
  clients: Joi.object({
    web: Joi.object({
      secret: Joi.string().required(),
      callback: Joi.string().required()
    }).required()
  }).required(),
  jwks: Joi.object({
    keys: Joi.array().items(Joi.object().required()).min(2).required()
  }),
  ressourceServer: Joi.object({
    url: Joi.string().required(),
    scopes: Joi.string().required()
  }),
  francetravailJeune: Joi.object({
    issuer: Joi.string().required(),
    realm: Joi.string().required(),
    authorizationUrl: Joi.string().required(),
    tokenUrl: Joi.string().required(),
    jwks: Joi.string().required(),
    userinfo: Joi.string().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    scopes: Joi.string().required(),
    redirectUri: Joi.string().required(),
    accessTokenMaxAge: Joi.number().required(),
    refreshTokenMaxAge: Joi.number().required()
  }),
  francetravailConseiller: Joi.object({
    issuer: Joi.string().required(),
    realm: Joi.string().required(),
    authorizationUrl: Joi.string().required(),
    tokenUrl: Joi.string().required(),
    jwks: Joi.string().required(),
    userinfo: Joi.string().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    scopes: Joi.string().required(),
    redirectUri: Joi.string().required(),
    accessTokenMaxAge: Joi.number().required(),
    refreshTokenMaxAge: Joi.number().required()
  }),
  miloConseiller: Joi.object({
    issuer: Joi.string().required(),
    authorizationUrl: Joi.string().required(),
    tokenUrl: Joi.string().required(),
    jwks: Joi.string().required(),
    userinfo: Joi.string().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    scopes: Joi.string().required(),
    redirectUri: Joi.string().required(),
    accessTokenMaxAge: Joi.number().required(),
    refreshTokenMaxAge: Joi.number().required()
  })
})
