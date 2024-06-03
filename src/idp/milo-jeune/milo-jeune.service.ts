import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ContextStorage } from '../../context-storage/context-storage.provider'
import { User } from '../../domain/user'
import { OidcService } from '../../oidc-provider/oidc.service'
import { PassEmploiAPIService } from '../../pass-emploi-api/pass-emploi-api.service'
import { TokenService } from '../../token/token.service'
import { IdpService } from '../common/idp.service'

@Injectable()
export class MiloJeuneService extends IdpService {
  constructor(
    context: ContextStorage,
    configService: ConfigService,
    oidcService: OidcService,
    tokenService: TokenService,
    passemploiapi: PassEmploiAPIService
  ) {
    super(
      'MiloJeuneService',
      User.Type.JEUNE,
      User.Structure.MILO,
      context,
      configService,
      oidcService,
      tokenService,
      passemploiapi
    )
  }
}
