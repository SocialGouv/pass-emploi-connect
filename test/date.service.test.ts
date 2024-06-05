import { DateTime } from 'luxon'
import { DateService } from '../src/date.service'
import { expect } from './utils'

describe('DateService', () => {
  describe('now', () => {
    it('renvoie now', () => {
      // Given
      const dateService = new DateService()

      // When
      const now = dateService.now()

      // Then
      expect(DateTime.now().toMillis() - now.toMillis()).to.be.lessThan(10)
    })
  })
})
