import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Request, Response } from 'express'
import { FrancetravailAPIClient } from '../../../src/api/francetravail-api.client'
import { PassEmploiAPIClient } from '../../../src/api/pass-emploi-api.client'
import { MiloJeuneService } from '../../../src/idp/milo-jeune/milo-jeune.service'
import { OidcService } from '../../../src/oidc-provider/oidc.service'
import { TokenService } from '../../../src/token/token.service'
import { AuthError } from '../../../src/utils/result/error'
import { failure, success } from '../../../src/utils/result/result'
import {
  createSandbox,
  expect,
  StubbedClass,
  stubClass
} from '../../test-utils'
import { testConfig } from '../../test-utils/module-for-testing'

describe('MiloJeuneService', () => {
  let miloJeuneService: MiloJeuneService
  const configService = testConfig()
  let tokenService: StubbedClass<TokenService>
  let passEmploiAPIClient: StubbedClass<PassEmploiAPIClient>
  let francetravailAPIClient: StubbedClass<FrancetravailAPIClient>
  let oidcService: StubbedClass<OidcService>

  beforeEach(() => {
    oidcService = stubClass(OidcService)
    tokenService = stubClass(TokenService)
    passEmploiAPIClient = stubClass(PassEmploiAPIClient)
    francetravailAPIClient = stubClass(FrancetravailAPIClient)
    miloJeuneService = new MiloJeuneService(
      configService,
      oidcService,
      tokenService,
      passEmploiAPIClient,
      francetravailAPIClient
    )
  })

  describe('getAuthorizationUrl', () => {
    it('renvoie success', () => {
      expect(miloJeuneService.getAuthorizationUrl('test')).to.deep.equal(
        success(
          'https://milo-jeune.com/authorize?client_id=milo-jeune&scope=&response_type=code&redirect_uri=&nonce=test'
        )
      )
    })
  })

  describe('callback', () => {
    it('renvoie erreur', async () => {
      // Given
      const sandbox = createSandbox()
      const request: StubbedType<Request> = stubInterface(sandbox)
      const response: StubbedType<Response> = stubInterface(sandbox)

      // When
      const result = await miloJeuneService.callback(request, response)

      // Then
      expect(result).to.deep.equal(failure(new AuthError('Retour Pass Emploi')))
    })
  })
})
