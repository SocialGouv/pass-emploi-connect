import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ContextStorage } from '../../context-storage/context-storage.provider'
import { User } from '../../domain/user'
import { OidcService } from '../../oidc-provider/oidc.service'
import { PassEmploiAPIClient } from '../../api/pass-emploi-api.client'
import { TokenService } from '../../token/token.service'
import { IdpService } from '../common/idp.service'
import { FrancetravailAPIClient } from '../../api/francetravail-api.client'

@Injectable()
export class FrancetravailConseillerBRSAService extends IdpService {
  constructor(
    context: ContextStorage,
    configService: ConfigService,
    oidcService: OidcService,
    tokenService: TokenService,
    passemploiapi: PassEmploiAPIClient,
    francetravailAPIClient: FrancetravailAPIClient
  ) {
    super(
      'FrancetravailConseillerBRSAService',
      User.Type.CONSEILLER,
      User.Structure.POLE_EMPLOI_BRSA,
      context,
      configService,
      oidcService,
      tokenService,
      passemploiapi,
      francetravailAPIClient
    )
  }
}
