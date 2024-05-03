import { ConfigService } from '@nestjs/config'
import { OidcService } from '../../oidc-provider/oidc.service'

export async function generateNewGrantId(
  configService: ConfigService,
  oidcService: OidcService,
  accountId: string,
  clientId: string,
  grantId?: string
) {
  let grant
  if (grantId) {
    // modification du grant existant dans la session
    grant = await oidcService.findGrant(grantId)
  } else {
    grant = oidcService.createGrant(accountId, clientId)
  }

  grant!.addOIDCScope('openid')
  grant!.addOIDCScope('profile')
  grant!.addOIDCScope('email')
  grant!.addResourceScope(
    configService.get('ressourceServer.url')!,
    configService.get('ressourceServer.scopes')!
  )

  const newGrantId = await grant!.save()

  return newGrantId
}
