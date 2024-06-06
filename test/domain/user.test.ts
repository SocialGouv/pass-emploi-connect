import { User, estJeuneFT } from '../../src/domain/user'
import { expect } from '../test-utils'

describe('User', () => {
  describe('estJeuneFT', () => {
    it('renvoie true si jeune FT', () => {
      // When
      const result = estJeuneFT(User.Type.JEUNE, User.Structure.POLE_EMPLOI_AIJ)

      // Then
      expect(result).to.be.true()
    })
    it('renvoie false si jeune MILO', () => {
      // When
      const result = estJeuneFT(User.Type.JEUNE, User.Structure.MILO)

      // Then
      expect(result).to.be.false()
    })
    it('renvoie false si conseiller FT', () => {
      // When
      const result = estJeuneFT(
        User.Type.CONSEILLER,
        User.Structure.POLE_EMPLOI_BRSA
      )

      // Then
      expect(result).to.be.false()
    })
  })
})
