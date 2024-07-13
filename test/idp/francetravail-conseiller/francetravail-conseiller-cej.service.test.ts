import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Request, Response } from 'express'
import { FrancetravailAPIClient } from '../../../src/api/francetravail-api.client'
import { PassEmploiAPIClient } from '../../../src/api/pass-emploi-api.client'
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
import { FrancetravailConseillerCEJService } from '../../../src/idp/francetravail-conseiller/francetravail-conseiller-cej.service'

describe('FrancetravailConseillerCEJService', () => {
  let francetravailConseillerCEJService: FrancetravailConseillerCEJService
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
    francetravailConseillerCEJService = new FrancetravailConseillerCEJService(
      configService,
      oidcService,
      tokenService,
      passEmploiAPIClient,
      francetravailAPIClient
    )
  })

  describe('getAuthorizationUrl', () => {
    it('renvoie success', () => {
      expect(
        francetravailConseillerCEJService.getAuthorizationUrl('test')
      ).to.deep.equal(
        success(
          'https://ft-conseiller.com/authorize?client_id=ft-conseiller&scope=&response_type=code&redirect_uri=&nonce=test&realm=agent'
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
      const result = await francetravailConseillerCEJService.callback(
        request,
        response
      )

      // Then
      expect(result).to.deep.equal(failure(new AuthError('Retour Pass Emploi')))
    })
  })
})
