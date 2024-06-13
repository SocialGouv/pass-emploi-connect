import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { FrancetravailJeuneCEJService } from '../../../src/idp/francetravail-jeune/francetravail-jeune.service'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/utils/result/result'
import { StubbedClass, expect } from '../../test-utils'
import { getApplicationWithStubbedDependencies } from '../../test-utils/module-for-testing'
import { FrancetravailBRSAService } from '../../../src/idp/francetravail-jeune/francetravail-brsa.service'
import { FrancetravailAIJService } from '../../../src/idp/francetravail-jeune/francetravail-aij.service'
import {
  AuthError,
  NonTraitable,
  NonTrouveError
} from '../../../src/utils/result/error'

describe('FrancetravailJeuneController', () => {
  let francetravailJeuneCEJService: StubbedClass<FrancetravailJeuneCEJService>
  let francetravailAIJService: StubbedClass<FrancetravailAIJService>
  let francetravailBRSAService: StubbedClass<FrancetravailBRSAService>
  let app: INestApplication
  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    francetravailJeuneCEJService = app.get(FrancetravailJeuneCEJService)
    francetravailAIJService = app.get(FrancetravailAIJService)
    francetravailBRSAService = app.get(FrancetravailBRSAService)
  })

  describe('GET /francetravail-jeune/connect/:interactionId', () => {
    describe('CEJ', () => {
      it('renvoie une url quand tout va bien', async () => {
        // Given
        francetravailJeuneCEJService.getAuthorizationUrl.returns(
          success('une-url')
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-jeune/connect/interactionId?type=cej')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect('Location', 'une-url')

        expect(
          francetravailJeuneCEJService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'cej')
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailJeuneCEJService.getAuthorizationUrl.returns(
          failure(new AuthError('NO_REASON'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-jeune/connect/interactionId?type=cej')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NO_REASON&typeUtilisateur=JEUNE&structureUtilisateur=POLE_EMPLOI'
          )

        expect(
          francetravailJeuneCEJService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'cej')
      })
    })
    describe('BRSA', () => {
      it('renvoie une url quand tout va bien', async () => {
        // Given
        francetravailBRSAService.getAuthorizationUrl.returns(success('une-url'))

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-jeune/connect/interactionId?type=brsa')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect('Location', 'une-url')

        expect(
          francetravailBRSAService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'brsa')
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailBRSAService.getAuthorizationUrl.returns(
          failure(new NonTrouveError('User'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-jeune/connect/interactionId?type=brsa')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NON_TROUVE&typeUtilisateur=JEUNE&structureUtilisateur=POLE_EMPLOI_BRSA'
          )

        expect(
          francetravailBRSAService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'brsa')
      })
    })
    describe('AIJ', () => {
      it('renvoie une url quand tout va bien', async () => {
        // Given
        francetravailAIJService.getAuthorizationUrl.returns(success('une-url'))

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-jeune/connect/interactionId?type=aij')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect('Location', 'une-url')

        expect(
          francetravailAIJService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'aij')
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailAIJService.getAuthorizationUrl.returns(
          failure(new NonTraitable('NO_REASON'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-jeune/connect/interactionId?type=aij')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NON_TRAITABLE&typeUtilisateur=JEUNE&structureUtilisateur=POLE_EMPLOI_AIJ'
          )

        expect(
          francetravailAIJService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'aij')
      })
    })
  })

  describe('GET /auth/realms/pass-emploi/broker/pe-jeune/endpoint', () => {
    describe('CEJ', () => {
      it('termine sans erreur quand tout va bien', async () => {
        // Given
        francetravailJeuneCEJService.callback.resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-jeune/endpoint')
          .query({ state: 'cej' })
          .expect(HttpStatus.OK)

        expect(francetravailJeuneCEJService.callback).to.have.been.calledOnce()
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailJeuneCEJService.callback.resolves(
          failure(new AuthError('NO_REASON'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-jeune/endpoint')
          .query({ state: 'cej' })
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NO_REASON&typeUtilisateur=JEUNE&structureUtilisateur=POLE_EMPLOI'
          )

        expect(francetravailJeuneCEJService.callback).to.have.been.calledOnce()
      })
    })
    describe('BRSA', () => {
      it('termine sans erreur quand tout va bien', async () => {
        // Given
        francetravailBRSAService.callback.resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-jeune/endpoint')
          .query({ state: 'brsa' })
          .expect(HttpStatus.OK)

        expect(francetravailBRSAService.callback).to.have.been.calledOnce()
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailBRSAService.callback.resolves(
          failure(new NonTrouveError('User'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-jeune/endpoint')
          .query({ state: 'brsa' })
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NON_TROUVE&typeUtilisateur=JEUNE&structureUtilisateur=POLE_EMPLOI_BRSA'
          )

        expect(francetravailBRSAService.callback).to.have.been.calledOnce()
      })
    })
    describe('AIJ', () => {
      it('termine sans erreur quand tout va bien', async () => {
        // Given
        francetravailAIJService.callback.resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-jeune/endpoint')
          .query({ state: 'aij' })
          .expect(HttpStatus.OK)

        expect(francetravailAIJService.callback).to.have.been.calledOnce()
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailAIJService.callback.resolves(
          failure(new NonTraitable('NO_REASON'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-jeune/endpoint')
          .query({ state: 'aij' })
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NON_TRAITABLE&typeUtilisateur=JEUNE&structureUtilisateur=POLE_EMPLOI_AIJ'
          )

        expect(francetravailAIJService.callback).to.have.been.calledOnce()
      })
    })
  })
})
