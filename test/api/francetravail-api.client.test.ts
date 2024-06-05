import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { FrancetravailAPIClient } from '../../src/api/francetravail-api.client'
import { failure, success } from '../../src/result/result'
import { testConfig } from '../utils/module-for-testing'
import { NonTrouveError } from '../../src/result/error'

describe('FrancetravailAPIClient', () => {
  let francetravailAPIClient: FrancetravailAPIClient
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()
    francetravailAPIClient = new FrancetravailAPIClient(
      configService,
      httpService
    )
  })
  describe('getCoordonness', () => {
    it("retourne les coordonnees lorsque l'appel est ok", async () => {
      // Given
      const token = 'tok'

      nock('https://pe.qvr', {
        reqheaders: {
          Authorization: () => true
        }
      })
        .get('/peconnect-coordonnees/v1/coordonnees')
        .reply(200, { nom: 'toto', prenom: 'titi', email: 'tata' })
        .isDone()

      // When
      const result = await francetravailAPIClient.getCoordonness(token)

      // Then
      expect(result).to.deep.equal(
        success({ nom: 'toto', prenom: 'titi', email: 'tata' })
      )
    })
    it("retourne failure lorsque l'appel est ko", async () => {
      // Given
      const token = 'tok'

      nock('https://pe.qvr', {
        reqheaders: {
          Authorization: () => true
        }
      })
        .get('/peconnect-coordonnees/v1/coordonnees')
        .reply(500)
        .isDone()

      // When
      const result = await francetravailAPIClient.getCoordonness(token)

      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Coordonnées FT'))
      )
    })
  })
})
