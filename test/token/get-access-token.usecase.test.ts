import { expect } from 'chai'
import {
  ContextKeyType,
  ContextStorage
} from '../../src/context-storage/context-storage.provider'
import { failure, success } from '../../src/result/result'
import { GetAccessTokenUsecase } from '../../src/token/get-access-token.usecase'
import { TokenService } from '../../src/token/token.service'
import { unAccount } from '../fixtures/fixtures'
import { StubbedClass, stubClass } from '../utils'
import { testConfig } from '../utils/module-for-testing'
import { IdpConfig, IdpConfigIdentifier } from '../../src/config/configuration'
import { NonTrouveError } from '../../src/result/error'

describe('GetAccessTokenUsecase', () => {
  let getAccessTokenUsecase: GetAccessTokenUsecase
  const configService = testConfig()
  let tokenService: StubbedClass<TokenService>
  let context: StubbedClass<ContextStorage>

  const idp: IdpConfig =
    configService.get('idps')[IdpConfigIdentifier.MILO_CONSEILLER]!

  const issuerConfig = {
    issuer: idp.issuer,
    authorization_endpoint: idp.authorizationUrl,
    token_endpoint: idp.tokenUrl,
    jwks_uri: idp.jwks,
    userinfo_endpoint: idp.userinfo
  }
  const clientConfig = {
    client_id: idp.clientId,
    client_secret: idp.clientSecret,
    redirect_uris: [idp.redirectUri],
    response_types: ['code'],
    scope: idp.scopes,
    token_endpoint_auth_method: 'client_secret_post'
  }

  const offlineToken = configService.get('test.miloConseillerOfflineToken')

  beforeEach(() => {
    tokenService = stubClass(TokenService)
    context = stubClass(ContextStorage)
    getAccessTokenUsecase = new GetAccessTokenUsecase(
      configService,
      tokenService,
      context
    )
  })
  describe('execute', () => {
    it('retourne le token quand tout est ok et que le token est frais', async () => {
      // Given
      const query = {
        account: unAccount()
      }
      tokenService.getToken.withArgs(query.account, 'access_token').resolves({
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
      tokenService.getToken.withArgs(query.account, 'access_token').resolves({
        token: 'string',
        expiresIn: 10,
        scope: ''
      })
      tokenService.getToken.withArgs(query.account, 'refresh_token').resolves({
        token: offlineToken,
        expiresIn: 100,
        scope: 'openid profile offline_access email'
      })
      context.get
        .withArgs({
          userType: query.account.type,
          userStructure: query.account.structure,
          key: ContextKeyType.ISSUER
        })
        .resolves(JSON.stringify(issuerConfig))
      context.get
        .withArgs({
          userType: query.account.type,
          userStructure: query.account.structure,
          key: ContextKeyType.CLIENT
        })
        .resolves(JSON.stringify(clientConfig))
      tokenService.setToken.resolves()

      // When
      const result = await getAccessTokenUsecase.execute(query)

      // Then
      expect(result._isSuccess).to.equal(true)
      if (result._isSuccess) {
        expect(result.data.expiresIn).to.be.oneOf([297, 298, 299, 300])
        expect(result.data.scope).to.equal(
          'openid profile offline_access email'
        )
      }
    })
    it('erreur quand refresh token inexistant', async () => {
      // Given
      const query = {
        account: unAccount()
      }

      // When
      const result = await getAccessTokenUsecase.execute(query)

      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError("L'utilisateur n'a pas de refresh token"))
      )
    })
    it('erreur quand config inexistante', async () => {
      // Given
      const query = {
        account: unAccount()
      }
      tokenService.getToken.withArgs(query.account, 'refresh_token').resolves({
        token: offlineToken,
        expiresIn: 100,
        scope: 'openid profile offline_access email'
      })

      // When
      const result = await getAccessTokenUsecase.execute(query)

      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Config introuvable pour le refresh'))
      )
    })
    it('erreur quand mauvais refresh token', async () => {
      // Given
      const query = {
        account: unAccount()
      }
      tokenService.getToken.withArgs(query.account, 'refresh_token').resolves({
        token: 'mauvais-token',
        expiresIn: 100,
        scope: 'openid profile offline_access email'
      })
      context.get
        .withArgs({
          userType: query.account.type,
          userStructure: query.account.structure,
          key: ContextKeyType.ISSUER
        })
        .resolves(JSON.stringify(issuerConfig))
      context.get
        .withArgs({
          userType: query.account.type,
          userStructure: query.account.structure,
          key: ContextKeyType.CLIENT
        })
        .resolves(JSON.stringify(clientConfig))

      // When
      const result = await getAccessTokenUsecase.execute(query)

      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Erreur refresh token'))
      )
    })
  })
})
