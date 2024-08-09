import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { ConseillerDeptService } from '../../../src/idp/conseiller-dept/conseiller-dept.service'
import { AuthError } from '../../../src/utils/result/error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/utils/result/result'
import { StubbedClass, expect } from '../../test-utils'
import { getApplicationWithStubbedDependencies } from '../../test-utils/module-for-testing'

describe('MiloConseillerController', () => {
  let conseillerDeptService: StubbedClass<ConseillerDeptService>
  let app: INestApplication
  before(async () => {
    app = await getApplicationWithStubbedDependencies()

    conseillerDeptService = app.get(ConseillerDeptService)
  })

  describe('GET /conseiller-dept/connect/:interactionId', () => {
    describe('CEJ', () => {
      it('renvoie une url quand tout va bien', async () => {
        // Given
        conseillerDeptService.getAuthorizationUrl.returns(success('une-url'))

        // When - Then
        await request(app.getHttpServer())
          .get('/conseiller-dept/connect/interactionId')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect('Location', 'une-url')

        expect(
          conseillerDeptService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId')
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        conseillerDeptService.getAuthorizationUrl.returns(
          failure(new AuthError('NO_REASON'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/conseiller-dept/connect/interactionId')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NO_REASON'
          )

        expect(
          conseillerDeptService.getAuthorizationUrl
        ).to.have.been.calledOnceWithExactly('interactionId')
      })
    })
  })

  describe('GET /auth/realms/pass-emploi/broker/conseiller-dept/endpoint', () => {
    describe('CEJ', () => {
      it('termine sans erreur quand tout va bien', async () => {
        // Given
        conseillerDeptService.callback.resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/conseiller-dept/endpoint')
          .expect(HttpStatus.OK)

        expect(conseillerDeptService.callback).to.have.been.calledOnce()
      })
      it('redirige vers le web en cas de failure', async () => {
        // Given
        conseillerDeptService.callback.resolves(
          failure(new AuthError('NO_REASON'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/auth/realms/pass-emploi/broker/conseiller-dept/endpoint')
          .expect(HttpStatus.TEMPORARY_REDIRECT)
          .expect(
            'Location',
            'https://web.pass-emploi.incubateur.net/autherror?reason=NO_REASON'
          )

        expect(conseillerDeptService.callback).to.have.been.calledOnce()
      })
    })
  })
})
