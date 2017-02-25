import { ConfigService } from '@nestjs/config'

export async function generateNewGrantId(
  configService: ConfigService,
  accountId: string,
  grantId?: string
) {
  let grant
  if (grantId) {
    // modification du grant existant dans la session
    grant = await this.oidcService.findGrant(grantId)
  } else {
    grant = this.oidcService.createGrant(accountId)
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
