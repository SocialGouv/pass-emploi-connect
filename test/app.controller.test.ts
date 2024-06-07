import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { getApplicationWithStubbedDependencies } from './test-utils/module-for-testing'

describe('AppController', () => {
  let app: INestApplication
  before(async () => {
    app = await getApplicationWithStubbedDependencies()
  })

  describe('GET /health', () => {
    it('renvoie ok', async () => {
      // When - Then
      await request(app.getHttpServer()).get('/health').expect(HttpStatus.OK)
    })
  })
})
