import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FrancetravailAPIClient } from '../../api/francetravail-api.client'
import { PassEmploiAPIClient } from '../../api/pass-emploi-api.client'
import { User } from '../../domain/user'
import { OidcService } from '../../oidc-provider/oidc.service'
import { TokenService } from '../../token/token.service'
import { IdpService } from '../service/idp.service'

@Injectable()
export class FrancetravailJeuneCEJService extends IdpService {
  constructor(
    configService: ConfigService,
    oidcService: OidcService,
    tokenService: TokenService,
    passemploiapi: PassEmploiAPIClient,
    francetravailAPIClient: FrancetravailAPIClient
  ) {
    super(
      'FrancetravailJeuneCEJService',
      User.Type.JEUNE,
      User.Structure.POLE_EMPLOI,
      configService,
      oidcService,
      tokenService,
      passemploiapi,
      francetravailAPIClient
    )
  }
}
