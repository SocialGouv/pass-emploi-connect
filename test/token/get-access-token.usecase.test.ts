import { expect } from 'chai'
import { GetAccessTokenUsecase } from '../../src/token/get-access-token.usecase'
import { TokenService, TokenType } from '../../src/token/token.service'
import { AuthError, NonTrouveError } from '../../src/utils/result/error'
import { failure, success } from '../../src/utils/result/result'
import { StubbedClass, stubClass } from '../test-utils'
import { unAccount } from '../test-utils/fixtures'
import { testConfig } from '../test-utils/module-for-testing'

describe('GetAccessTokenUsecase', () => {
  let getAccessTokenUsecase: GetAccessTokenUsecase
  const configService = testConfig()
  let tokenService: StubbedClass<TokenService>

  const offlineToken = configService.get('test.miloConseillerOfflineToken')

  beforeEach(() => {
    tokenService = stubClass(TokenService)
    getAccessTokenUsecase = new GetAccessTokenUsecase(
      configService,
      tokenService
    )
  })
  describe('execute', () => {
    it('retourne le token quand tout est ok et que le token est frais', async () => {
      // Given
      const query = {
        account: unAccount()
      }
      tokenService.getToken.withArgs(query.account, TokenType.ACCESS).resolves({
        token: 'string',
        expiresIn: 100,
        scope: ''
      })

      // When
      const result = await getAccessTokenUsecase.execute(query)

      // Then
      expect(result).to.deep.equal(
        success({
          token: 'string',
          expiresIn: 100,
          scope: ''
        })
      )
    })
    it('refresh et retourne le token quand tout est ok et que le token est expiré', async () => {
      // Given
      const query = {
        account: unAccount()
      }
      tokenService.getToken
        .withArgs(query.account, TokenType.ACCESS)
        .resolves(undefined)
      tokenService.getToken
        .withArgs(query.account, TokenType.REFRESH)
        .resolves({
          token: offlineToken,
          expiresIn: 100,
          scope: ''
        })
      tokenService.setToken.resolves()

      // When
      const result = await getAccessTokenUsecase.execute(query)

      // Then
      expect(result._isSuccess).to.equal(true)
      if (result._isSuccess) {
        expect(result.data.expiresIn).to.be.oneOf([298, 299, 300])
        expect(result.data.scope).to.equal(
          'openid profile offline_access email'
        )
      }
      expect(tokenService.setToken).to.have.been.calledTwice()
    })
    it('erreur quand refresh token inexistant', async () => {
      // Given
      const query = {
        account: unAccount()
      }

      // When
      const result = await getAccessTokenUsecase.execute(query)

      // Then
      expect(result).to.deep.equal(failure(new NonTrouveError('Refresh token')))
    })
    it('erreur quand getToken echoue', async () => {
      // Given
      const query = {
        account: unAccount()
      }
      tokenService.getToken.throws()

      // When
      const result = await getAccessTokenUsecase.execute(query)

      // Then
      expect(result).to.deep.equal(failure(new NonTrouveError('AcessToken')))
    })
    it('erreur quand mauvais refresh token', async () => {
      // Given
      const query = {
        account: unAccount()
      }
      tokenService.getToken
        .withArgs(query.account, TokenType.REFRESH)
        .resolves({
          token: 'mauvais-token',
          expiresIn: 100,
          scope: 'openid profile offline_access email'
        })

      // When
      const result = await getAccessTokenUsecase.execute(query)

      // Then
      expect(result).to.deep.equal(
        failure(new AuthError(`ERROR_REFRESH_TOKEN_IDP_CONSEILLER_MILO`))
      )
    })
  })
})
