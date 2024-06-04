import { expect } from 'chai'
import { ValidateJWTUsecase } from '../../src/token/verify-jwt.usecase'
import { unJwtPayloadValide } from '../utils/fixtures'
import { testConfig } from '../utils/module-for-testing'

describe('ValidateJWTUsecase', () => {
  let validateJWTUsecase: ValidateJWTUsecase
  const configService = testConfig()

  beforeEach(() => {
    validateJWTUsecase = new ValidateJWTUsecase(configService)
  })
  describe('execute', () => {
    xit('retourne le JWTPayload quand tout est ok', async () => {
      // Given
      const inputs = {
        token: configService.get('test.miloConseillerCEJJWT')
      }

      // When
      const result = await validateJWTUsecase.execute(inputs)

      // Then
      expect(result).to.deep.equal(unJwtPayloadValide())
    })
  })
})
