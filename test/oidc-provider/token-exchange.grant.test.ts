import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect } from 'chai'
import { KoaContextWithOIDC } from 'oidc-provider'
import { OidcProviderModule } from '../../src/oidc-provider/provider'
import { TokenExchangeGrant } from '../../src/oidc-provider/token-exchange.grant'
import { failure, success } from '../../src/utils/result/result'
import { GetAccessTokenUsecase } from '../../src/token/get-access-token.usecase'
import { ValidateJWTUsecase } from '../../src/token/verify-jwt.usecase'
import { StubbedClass, createSandbox, stubClass } from '../test-utils'
import { unAccount, unTokenData } from '../test-utils/fixtures'
import { JWTError, NonTrouveError } from '../../src/utils/result/error'
import { User } from '../../src/domain/user'

describe('TokenExchangeGrant', () => {
  let tokenExchangeGrant: TokenExchangeGrant
  let opm: StubbedType<OidcProviderModule>
  let validateJWTUsecase: StubbedClass<ValidateJWTUsecase>
  let getAccessTokenUsecase: StubbedClass<GetAccessTokenUsecase>

  beforeEach(() => {
    const sandbox = createSandbox()
    opm = stubInterface(sandbox)
    validateJWTUsecase = stubClass(ValidateJWTUsecase)
    getAccessTokenUsecase = stubClass(GetAccessTokenUsecase)
    tokenExchangeGrant = new TokenExchangeGrant(
      opm,
      validateJWTUsecase,
      getAccessTokenUsecase
    )
  })
  describe('handler', () => {
    it('exchange le token quand tout est ok', async () => {
      // Given
      const context = {
        oidc: { params: { subject_token: 'tok' } },
        body: {}
      }
      validateJWTUsecase.execute.resolves(
        success({
          sub: 'CONSEILLER|MILO|id-auth',
          userType: 'CONSEILLER',
          userStructure: 'MILO'
        })
      )
      const tokenData = unTokenData()
      getAccessTokenUsecase.execute.resolves(success(tokenData))

      // When
      await tokenExchangeGrant.handler(
        context as unknown as KoaContextWithOIDC,
        () => {
          return Promise.resolve()
        }
      )

      // Then
      expect(validateJWTUsecase.execute).to.have.been.calledOnceWithExactly({
        token: 'tok'
      })
      expect(getAccessTokenUsecase.execute).to.have.been.calledOnceWithExactly({
        account: unAccount({ sub: 'id-auth' })
      })
      expect(context.body).to.deep.equal({
        issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        access_token: tokenData.token,
        token_type: 'bearer',
        expires_in: tokenData.expiresIn,
        scope: tokenData.scope
      })
    })
    it('exchange le token pour un sub different', async () => {
      // Given
      const context = {
        oidc: {
          params: { subject_token: 'tok', requested_token_sub: 'sub_jeune' }
        },
        body: {}
      }
      validateJWTUsecase.execute.resolves(
        success({
          sub: 'CONSEILLER|MILO|id-auth',
          userType: 'CONSEILLER',
          userStructure: 'MILO'
        })
      )
      const tokenData = unTokenData()
      getAccessTokenUsecase.execute.resolves(success(tokenData))

      // When
      await tokenExchangeGrant.handler(
        context as unknown as KoaContextWithOIDC,
        () => {
          return Promise.resolve()
        }
      )

      // Then
      expect(validateJWTUsecase.execute).to.have.been.calledOnceWithExactly({
        token: 'tok'
      })
      expect(getAccessTokenUsecase.execute).to.have.been.calledOnceWithExactly({
        account: unAccount({ sub: 'sub_jeune', type: User.Type.JEUNE })
      })
      expect(context.body).to.deep.equal({
        issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        access_token: tokenData.token,
        token_type: 'bearer',
        expires_in: tokenData.expiresIn,
        scope: tokenData.scope
      })
    })
    it('erreur quand le subject token est introuvable', async () => {
      // Given
      const context = {}

      try {
        // When
        await tokenExchangeGrant.handler(
          context as unknown as KoaContextWithOIDC,
          () => {
            return Promise.resolve()
          }
        )
        expect.fail(null, null, 'handle test did not reject with an error')
      } catch (e) {
        // Then
        expect(validateJWTUsecase.execute).not.to.have.been.called()
        expect(getAccessTokenUsecase.execute).not.to.have.been.called()
        expect(e).to.be.an.instanceOf(Error)
      }
    })
    it('erreur quand le subject token est invalide', async () => {
      // Given
      const context = {
        oidc: { params: { subject_token: 'tok' } },
        body: {}
      }
      validateJWTUsecase.execute.resolves(failure(new JWTError('ERR')))

      try {
        // When
        await tokenExchangeGrant.handler(
          context as unknown as KoaContextWithOIDC,
          () => {
            return Promise.resolve()
          }
        )
        expect.fail(null, null, 'handle test did not reject with an error')
      } catch (e) {
        // Then
        expect(validateJWTUsecase.execute).to.have.been.calledOnceWithExactly({
          token: 'tok'
        })
        expect(getAccessTokenUsecase.execute).not.to.have.been.called()
        expect(e).to.be.an.instanceOf(Error)
      }
    })
    it('erreur quand impossible de récupérer un access token', async () => {
      // Given
      const context = {
        oidc: { params: { subject_token: 'tok' } },
        body: {}
      }
      validateJWTUsecase.execute.resolves(
        success({
          sub: 'CONSEILLER|MILO|id-auth',
          userType: 'CONSEILLER',
          userStructure: 'MILO'
        })
      )
      getAccessTokenUsecase.execute.resolves(
        failure(new NonTrouveError('token'))
      )

      try {
        // When
        await tokenExchangeGrant.handler(
          context as unknown as KoaContextWithOIDC,
          () => {
            return Promise.resolve()
          }
        )
        expect.fail(null, null, 'handle test did not reject with an error')
      } catch (e) {
        // Then
        expect(validateJWTUsecase.execute).to.have.been.calledOnceWithExactly({
          token: 'tok'
        })
        expect(
          getAccessTokenUsecase.execute
        ).to.have.been.calledOnceWithExactly({
          account: unAccount({ sub: 'id-auth' })
        })
        expect(e).to.be.an.instanceOf(Error)
      }
    })
  })
})
