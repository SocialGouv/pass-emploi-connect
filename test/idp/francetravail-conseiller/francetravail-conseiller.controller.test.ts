import { HttpStatus, INestApplication } from '@nestjs/common'
import { FrancetravailConseillerAccompagnementIntensifService } from 'src/idp/francetravail-conseiller/francetravail-conseiller-accompagnement-intensif.service'
import * as request from 'supertest'
import { FrancetravailConseillerCEJService } from '../../../src/idp/francetravail-conseiller/francetravail-conseiller-cej.service'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/utils/result/result'
import { StubbedClass, expect } from '../../test-utils'
import { getApplicationWithStubbedDependencies } from '../../test-utils/module-for-testing'
import { FrancetravailConseillerBRSAService } from '../../../src/idp/francetravail-conseiller/francetravail-conseiller-brsa.service'
import { FrancetravailConseillerAIJService } from '../../../src/idp/francetravail-conseiller/francetravail-conseiller-aij.service'
import {
  AuthError,
  UtilisateurNonTraitable,
  NonTrouveError
} from '../../../src/utils/result/error'

describe('FrancetravailConseillerController', () => {
  let francetravailConseillerCEJService: StubbedClass<FrancetravailConseillerCEJService>
  let francetravailConseillerAIJService: StubbedClass<FrancetravailConseillerAIJService>
  let francetravailConseillerBRSAService: StubbedClass<FrancetravailConseillerBRSAService>
  let francetravailConseillerAccompagnementIntensifService: StubbedClass<FrancetravailConseillerAccompagnementIntensifService>
  let app: INestApplication
  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    francetravailConseillerCEJService = app.get(
      FrancetravailConseillerCEJService
    )
    francetravailConseillerAIJService = app.get(
      FrancetravailConseillerAIJService
    )
    francetravailConseillerBRSAService = app.get(
      FrancetravailConseillerBRSAService
    )
    francetravailConseillerAccompagnementIntensifService = app.get(
      FrancetravailConseillerAccompagnementIntensifService
    )
  })

  describe('GET /francetravail-conseiller/connect/:interactionId', () => {
    describe('CEJ', () => {
      it('renvoie une url quand tout va bien', async () => {
        // Given
        francetravailConseillerCEJService.getAuthorizationUrl.returns(
          success('une-url')
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-conseiller/connect/interactionId?type=cej')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect('Location', 'une-url')

        expect(
          francetravailConseillerCEJService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'cej')
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailConseillerCEJService.getAuthorizationUrl.returns(
          failure(new AuthError('NO_REASON'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-conseiller/connect/interactionId?type=cej')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NO_REASON&typeUtilisateur=CONSEILLER&structureUtilisateur=POLE_EMPLOI'
          )

        expect(
          francetravailConseillerCEJService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'cej')
      })
    })

    describe('BRSA', () => {
      it('renvoie une url quand tout va bien', async () => {
        // Given
        francetravailConseillerBRSAService.getAuthorizationUrl.returns(
          success('une-url')
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-conseiller/connect/interactionId?type=brsa')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect('Location', 'une-url')

        expect(
          francetravailConseillerBRSAService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'brsa')
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailConseillerBRSAService.getAuthorizationUrl.returns(
          failure(new NonTrouveError('User'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-conseiller/connect/interactionId?type=brsa')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NON_TROUVE&typeUtilisateur=CONSEILLER&structureUtilisateur=POLE_EMPLOI_BRSA'
          )

        expect(
          francetravailConseillerBRSAService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'brsa')
      })
    })

    describe('AIJ', () => {
      it('renvoie une url quand tout va bien', async () => {
        // Given
        francetravailConseillerAIJService.getAuthorizationUrl.returns(
          success('une-url')
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-conseiller/connect/interactionId?type=aij')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect('Location', 'une-url')

        expect(
          francetravailConseillerAIJService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'aij')
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailConseillerAIJService.getAuthorizationUrl.returns(
          failure(new UtilisateurNonTraitable('NO_REASON'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/francetravail-conseiller/connect/interactionId?type=aij')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NO_REASON&typeUtilisateur=CONSEILLER&structureUtilisateur=POLE_EMPLOI_AIJ'
          )

        expect(
          francetravailConseillerAIJService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId', 'aij')
      })
    })

    describe('Accompagnement intensif', () => {
      it('renvoie une url quand tout va bien', async () => {
        // Given
        francetravailConseillerAccompagnementIntensifService.getAuthorizationUrl.returns(
          success('une-url')
        )

        // When - Then
        await request(app.getHttpServer())
          .get(
            '/francetravail-conseiller/connect/interactionId?type=accompagnement-intensif'
          )
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect('Location', 'une-url')

        expect(
          francetravailConseillerAccompagnementIntensifService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly(
          'interactionId',
          'accompagnement-intensif'
        )
      })

      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailConseillerAccompagnementIntensifService.getAuthorizationUrl.returns(
          failure(new UtilisateurNonTraitable('NO_REASON'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get(
            '/francetravail-conseiller/connect/interactionId?type=accompagnement-intensif'
          )
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NO_REASON&typeUtilisateur=CONSEILLER&structureUtilisateur=FT_ACCOMPAGNEMENT_INTENSIF'
          )

        expect(
          francetravailConseillerAccompagnementIntensifService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly(
          'interactionId',
          'accompagnement-intensif'
        )
      })
    })
  })

  describe('GET /auth/realms/pass-emploi/broker/pe-conseiller/endpoint', () => {
    describe('CEJ', () => {
      it('termine sans erreur quand tout va bien', async () => {
        // Given
        francetravailConseillerCEJService.callback.resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-conseiller/endpoint')
          .query({ state: 'cej' })
          .expect(HttpStatus.OK)

        expect(
          francetravailConseillerCEJService.callback
        ).to.have.been.calledOnce()
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailConseillerCEJService.callback.resolves(
          failure(new AuthError('NO_REASON'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-conseiller/endpoint')
          .query({ state: 'cej' })
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NO_REASON&typeUtilisateur=CONSEILLER&structureUtilisateur=POLE_EMPLOI'
          )

        expect(
          francetravailConseillerCEJService.callback
        ).to.have.been.calledOnce()
      })
    })

    describe('BRSA', () => {
      it('termine sans erreur quand tout va bien', async () => {
        // Given
        francetravailConseillerBRSAService.callback.resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-conseiller/endpoint')
          .query({ state: 'brsa' })
          .expect(HttpStatus.OK)

        expect(
          francetravailConseillerBRSAService.callback
        ).to.have.been.calledOnce()
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailConseillerBRSAService.callback.resolves(
          failure(new NonTrouveError('User'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-conseiller/endpoint')
          .query({ state: 'brsa' })
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NON_TROUVE&typeUtilisateur=CONSEILLER&structureUtilisateur=POLE_EMPLOI_BRSA'
          )

        expect(
          francetravailConseillerBRSAService.callback
        ).to.have.been.calledOnce()
      })
    })

    describe('AIJ', () => {
      it('termine sans erreur quand tout va bien', async () => {
        // Given
        francetravailConseillerAIJService.callback.resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-conseiller/endpoint')
          .query({ state: 'aij' })
          .expect(HttpStatus.OK)

        expect(
          francetravailConseillerAIJService.callback
        ).to.have.been.calledOnce()
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailConseillerAIJService.callback.resolves(
          failure(new UtilisateurNonTraitable('UTILISATEUR_INEXISTANT'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-conseiller/endpoint')
          .query({ state: 'aij' })
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=UTILISATEUR_INEXISTANT&typeUtilisateur=CONSEILLER&structureUtilisateur=POLE_EMPLOI_AIJ'
          )

        expect(
          francetravailConseillerAIJService.callback
        ).to.have.been.calledOnce()
      })
    })

    describe('Accompagnement intensif', () => {
      it('termine sans erreur quand tout va bien', async () => {
        // Given
        francetravailConseillerAccompagnementIntensifService.callback.resolves(
          emptySuccess()
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-conseiller/endpoint')
          .query({ state: 'accompagnement-intensif' })
          .expect(HttpStatus.OK)

        expect(
          francetravailConseillerAccompagnementIntensifService.callback
        ).to.have.been.calledOnce()
      })

      it('redirige vers le web en cas de failure', async () => {
        // Given
        francetravailConseillerAccompagnementIntensifService.callback.resolves(
          failure(new UtilisateurNonTraitable('UTILISATEUR_INEXISTANT'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/pe-conseiller/endpoint')
          .query({ state: 'accompagnement-intensif' })
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=UTILISATEUR_INEXISTANT&typeUtilisateur=CONSEILLER&structureUtilisateur=FT_ACCOMPAGNEMENT_INTENSIF'
          )

        expect(
          francetravailConseillerAccompagnementIntensifService.callback
        ).to.have.been.calledOnce()
      })
    })
  })
})
