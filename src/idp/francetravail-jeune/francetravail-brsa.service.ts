import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ContextStorage } from '../../context-storage/context-storage.provider'
import { User } from '../../domain/user'
import { OidcService } from '../../oidc-provider/oidc.service'
import { PassEmploiAPIService } from '../../pass-emploi-api/pass-emploi-api.service'
import { TokenService } from '../../token/token.service'
import { IdpService } from '../common/idp.service'

@Injectable()
export class FrancetravailBRSAService extends IdpService {
  constructor(
    context: ContextStorage,
    configService: ConfigService,
    oidcService: OidcService,
    tokenService: TokenService,
    passemploiapi: PassEmploiAPIService
  ) {
    super(
      'FrancetravailBRSAService',
      User.Type.JEUNE,
      User.Structure.POLE_EMPLOI_BRSA,
      context,
      configService,
      oidcService,
      tokenService,
      passemploiapi
    )
  }
}
