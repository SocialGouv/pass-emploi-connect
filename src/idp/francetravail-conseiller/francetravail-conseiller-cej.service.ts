import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ContextStorage } from '../../context-storage/context-storage.provider'
import { User } from '../../domain/user'
import { OidcService } from '../../oidc-provider/oidc.service'
import { PassEmploiAPIClient } from '../../api/pass-emploi-api.client'
import { TokenService } from '../../token/token.service'
import { IdpService } from '../service/idp.service'
import { FrancetravailAPIClient } from '../../api/francetravail-api.client'

@Injectable()
export class FrancetravailConseillerCEJService extends IdpService {
  constructor(
    context: ContextStorage,
    configService: ConfigService,
    oidcService: OidcService,
    tokenService: TokenService,
    passemploiapi: PassEmploiAPIClient,
    francetravailAPIClient: FrancetravailAPIClient
  ) {
    super(
      'FrancetravailConseillerCEJService',
      User.Type.CONSEILLER,
      User.Structure.POLE_EMPLOI,
      context,
      configService,
      oidcService,
      tokenService,
      passemploiapi,
      francetravailAPIClient
    )
  }
}
