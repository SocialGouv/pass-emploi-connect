import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IdpConfigIdentifier } from '../../config/configuration'
import { ContextStorage } from '../../context-storage/context-storage.provider'
import { User } from '../../domain/user'
import { OidcService } from '../../oidc-provider/oidc.service'
import { PassEmploiAPIService } from '../../pass-emploi-api/pass-emploi-api.service'
import { TokenService } from '../../token/token.service'
import { IdpService } from '../common/idp.service'

@Injectable()
export class FrancetravailConseillerCEJService extends IdpService {
  constructor(
    context: ContextStorage,
    configService: ConfigService,
    oidcService: OidcService,
    tokenService: TokenService,
    passemploiapi: PassEmploiAPIService
  ) {
    super(
      'FrancetravailConseillerCEJService',
      User.Type.CONSEILLER,
      User.Structure.POLE_EMPLOI,
      IdpConfigIdentifier.FT_CONSEILLER,
      context,
      configService,
      oidcService,
      tokenService,
      passemploiapi
    )
  }
}