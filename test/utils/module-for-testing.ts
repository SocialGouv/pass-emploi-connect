/* eslint-disable no-process-env */
import { HttpModule } from '@nestjs/axios'
import { INestApplication, Provider, ValidationPipe } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SinonSandbox, createSandbox } from 'sinon'
import { PassEmploiAPIService } from '../../src/pass-emploi-api/pass-emploi-api.service'
import { stubClassSandbox } from './types'
import { Test, TestingModuleBuilder } from '@nestjs/testing'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.environment' })

const IDP_FT_CONSEILLER_ACCESS_TOKEN_MAX_AGE = 1800
const IDP_FT_CONSEILLER_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 42
const IDP_FT_JEUNE_ACCESS_TOKEN_MAX_AGE = 1800
const IDP_FT_JEUNE_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 42
const IDP_MILO_CONSEILLER_ACCESS_TOKEN_MAX_AGE = 300
const IDP_MILO_CONSEILLER_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 30
const IDP_MILO_JEUNE_ACCESS_TOKEN_MAX_AGE = 300
const IDP_MILO_JEUNE_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 30

export function buildTestingModuleForHttpTesting(
  sandbox: SinonSandbox = createSandbox()
): TestingModuleBuilder {
  return Test.createTestingModule({
    imports: [HttpModule, ConfigModule.forRoot()],
    providers: stubProviders(sandbox),
    controllers: []
  })
}

let applicationForHttpTesting: INestApplication
let sandbox: SinonSandbox

export const getApplicationWithStubbedDependencies =
  async (): Promise<INestApplication> => {
    if (!applicationForHttpTesting) {
      sandbox = createSandbox()
      const testingModule = await buildTestingModuleForHttpTesting(
        sandbox
      ).compile()

      applicationForHttpTesting = testingModule.createNestApplication()
      applicationForHttpTesting.useGlobalPipes(
        new ValidationPipe({ whitelist: true })
      )
      await applicationForHttpTesting.init()
    }

    afterEach(() => {
      sandbox.reset()
    })
    return applicationForHttpTesting
  }

export const testConfig = (): ConfigService => {
  return new ConfigService({
    environment: 'staging',
    port: 5050,
    publicAddress: `http://localhost:5050`,
    cors: {
      allowedOrigins: []
    },
    passemploiapi: {
      url: 'https://api.pass-emploi.fr',
      key: 'pass-emploi-api-key'
    },
    redis: {
      url: 'redis://localhost:6767'
    },
    clients: {
      web: {
        id: 'web',
        secret: 'web-secret',
        callbacks: [],
        errorCallback: '',
        logoutCallbacks: []
      },
      app: {
        id: 'app',
        secret: 'app-secret',
        callbacks: []
      },
      api: {
        id: 'api',
        secret: 'api-secret'
      },
      swagger: {
        id: 'swag',
        secret: 'swag-secret',
        callbacks: []
      }
    },
    ressourceServer: {
      url: 'rsrc',
      scopes: ''
    },
    jwks: [],
    idps: {
      francetravailJeune: {
        issuer: 'ft-jeune.com',
        realm: 'individu',
        authorizationUrl: 'ft-jeune.com/authorize',
        tokenUrl: 'ft-jeune.com/token',
        jwks: 'ft-jeune.com/jwks',
        userinfo: 'ft-jeune.com/userinfo',
        clientId: 'ft-jeune',
        clientSecret: 'ft-jeune-secret',
        scopes: '',
        redirectUri: '',
        logout: '',
        accessTokenMaxAge: IDP_FT_JEUNE_ACCESS_TOKEN_MAX_AGE,
        refreshTokenMaxAge: IDP_FT_JEUNE_REFRESH_TOKEN_MAX_AGE
      },
      francetravailConseiller: {
        issuer: 'ft-conseiller.com',
        realm: 'agent',
        authorizationUrl: 'ft-conseiller.com/authorize',
        tokenUrl: 'ft-conseiller.com/token',
        jwks: 'ft-conseiller.com/jwks',
        userinfo: 'ft-conseiller.com/userinfo',
        clientId: 'ft-conseiller',
        clientSecret: 'ft-conseiller-secret',
        scopes: '',
        redirectUri: '',
        logout: '',
        accessTokenMaxAge: IDP_FT_CONSEILLER_ACCESS_TOKEN_MAX_AGE,
        refreshTokenMaxAge: IDP_FT_CONSEILLER_REFRESH_TOKEN_MAX_AGE
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
        logout: '',
        accessTokenMaxAge: IDP_MILO_CONSEILLER_ACCESS_TOKEN_MAX_AGE,
        refreshTokenMaxAge: IDP_MILO_CONSEILLER_REFRESH_TOKEN_MAX_AGE
      },
      miloJeune: {
        issuer: 'milo-jeune.com',
        authorizationUrl: 'milo-jeune.com/authorize',
        tokenUrl: 'milo-jeune.com/token',
        jwks: 'milo-jeune.com/jwks',
        userinfo: 'milo-jeune.com/userinfo',
        clientId: 'milo-jeune',
        clientSecret: 'milo-jeune-secret',
        scopes: '',
        redirectUri: '',
        logout: '',
        accessTokenMaxAge: IDP_MILO_JEUNE_ACCESS_TOKEN_MAX_AGE,
        refreshTokenMaxAge: IDP_MILO_JEUNE_REFRESH_TOKEN_MAX_AGE
      }
    },
    test: {
      miloConseillerOfflineToken: process.env.TEST_MILO_CONSEILLER_OFFLINE_TOKEN
    }
  })
}

const stubProviders = (sandbox: SinonSandbox): Provider[] => {
  const providers: Provider[] = [
    {
      provide: ConfigService,
      useValue: testConfig()
    },
    {
      provide: PassEmploiAPIService,
      useValue: stubClassSandbox(PassEmploiAPIService, sandbox)
    }
  ]
  return providers
}
