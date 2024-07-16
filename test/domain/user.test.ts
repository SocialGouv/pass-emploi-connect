import { User, estBeneficiaireFT, estConseillerFT } from '../../src/domain/user'
import { expect } from '../test-utils'

describe('User', () => {
  describe('estJeuneFT', () => {
    it('renvoie true si jeune FT', () => {
      // When
      const result = estBeneficiaireFT(
        User.Type.JEUNE,
        User.Structure.POLE_EMPLOI_AIJ
      )

      // Then
      expect(result).to.be.true()
    })
    it('renvoie true si beneficiaire FT', () => {
      // When
      const result = estBeneficiaireFT(
        User.Type.BENEFICIAIRE,
        User.Structure.FRANCE_TRAVAIL
      )

      // Then
      expect(result).to.be.true()
    })
    it('renvoie false si beneficiaire Milo', () => {
      // When
      const result = estBeneficiaireFT(
        User.Type.BENEFICIAIRE,
        User.Structure.MILO
      )

      // Then
      expect(result).to.be.false()
    })
    it('renvoie false si jeune MILO', () => {
      // When
      const result = estBeneficiaireFT(User.Type.JEUNE, User.Structure.MILO)

      // Then
      expect(result).to.be.false()
    })
    it('renvoie false si conseiller FT', () => {
      // When
      const result = estBeneficiaireFT(
        User.Type.CONSEILLER,
        User.Structure.POLE_EMPLOI_BRSA
      )

      // Then
      expect(result).to.be.false()
    })
  })
  describe('estConseillerFT', () => {
    it('renvoie true si conseiller FT', () => {
      // When
      const result = estConseillerFT(
        User.Type.CONSEILLER,
        User.Structure.POLE_EMPLOI_AIJ
      )

      // Then
      expect(result).to.be.true()
    })
    it('renvoie false si conseiller MILO', () => {
      // When
      const result = estConseillerFT(User.Type.CONSEILLER, User.Structure.MILO)

      // Then
      expect(result).to.be.false()
    })
    it('renvoie false si jeune FT', () => {
      // When
      const result = estConseillerFT(
        User.Type.JEUNE,
        User.Structure.POLE_EMPLOI_BRSA
      )

      // Then
      expect(result).to.be.false()
    })
  })
})
