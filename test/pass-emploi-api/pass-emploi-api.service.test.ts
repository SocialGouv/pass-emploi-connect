import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { PassEmploiAPIService } from '../../src/pass-emploi-api/pass-emploi-api.service'
import { NonTraitable, NonTrouveError } from '../../src/result/error'
import { failure, success } from '../../src/result/result'
import { unAccount, unPassEmploiUser, unUser } from '../utils/fixtures'
import { testConfig } from '../utils/module-for-testing'

describe('PassEmploiAPIService', () => {
  let passEmploiAPIService: PassEmploiAPIService
  const configService = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()
    passEmploiAPIService = new PassEmploiAPIService(configService, httpService)
  })
  describe('putUser', () => {
    it("retourne l'utilisateur lorsque l'appel est ok", async () => {
      // Given
      const apiUser = {
        id: 'un-id',
        type: 'CONSEILLER',
        structure: 'MILO',
        prenom: 'Bruno',
        roles: [],
        nom: 'Dumont',
        email: 'zema@octo.com',
        username: 'b.dumont'
      }

      nock('https://api.pass-emploi.fr')
        .put(
          '/auth/users/un-sub',
          unPassEmploiUser() as unknown as nock.RequestBodyMatcher
        )
        .reply(200, apiUser)
        .isDone()

      // When
      const response = await passEmploiAPIService.putUser(
        'un-sub',
        unPassEmploiUser()
      )

      // Then
      expect(response).to.deep.equal(success(unUser()))
    })
    it("retourne une failure quand l'appel d'API échoue avec un code NonTraitable connu", async () => {
      // Given
      nock('https://api.pass-emploi.fr')
        .put(
          '/auth/users/un-sub',
          unPassEmploiUser() as unknown as nock.RequestBodyMatcher
        )
        .reply(422, { code: 'UTILISATEUR_INEXISTANT' })
        .isDone()

      // When
      const response = await passEmploiAPIService.putUser(
        'un-sub',
        unPassEmploiUser()
      )

      // Then
      expect(response).to.deep.equal(
        failure(new NonTraitable('UTILISATEUR_INEXISTANT'))
      )
    })
    it("retourne une failure quand l'appel d'API échoue avec un code NonTraitable inconnu", async () => {
      // Given
      nock('https://api.pass-emploi.fr')
        .put(
          '/auth/users/un-sub',
          unPassEmploiUser() as unknown as nock.RequestBodyMatcher
        )
        .reply(422, { code: 'INCONNU' })
        .isDone()

      // When
      const response = await passEmploiAPIService.putUser(
        'un-sub',
        unPassEmploiUser()
      )

      // Then
      expect(response).to.deep.equal(failure(new NonTraitable()))
    })
  })
  describe('getUser', () => {
    it("retourne l'utilisateur lorsque l'appel est ok", async () => {
      // Given
      const account = unAccount()
      const apiUser = {
        id: 'un-id',
        type: 'CONSEILLER',
        structure: 'MILO',
        prenom: 'Bruno',
        roles: [],
        nom: 'Dumont',
        email: 'zema@octo.com',
        username: 'b.dumont'
      }
      nock('https://api.pass-emploi.fr')
        .get('/auth/users/un-sub')
        .query({
          typeUtilisateur: account.type,
          structureUtilisateur: account.structure
        })
        .reply(200, apiUser)
        .isDone()

      // When
      const response = await passEmploiAPIService.getUser(account)

      // Then
      expect(response).to.deep.equal(success(unUser()))
    })
    it("retourne une failure quand l'appel d'API échoue", async () => {
      // Given
      const account = unAccount()
      nock('https://api.pass-emploi.fr')
        .get('/auth/users/un-sub')
        .query({
          typeUtilisateur: account.type,
          structureUtilisateur: account.structure
        })
        .reply(404)
        .isDone()

      // When
      const response = await passEmploiAPIService.getUser(unAccount())

      // Then
      expect(response).to.deep.equal(
        failure(new NonTrouveError('User', account.sub))
      )
    })
  })
})
