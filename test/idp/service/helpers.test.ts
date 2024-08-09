import { User } from '../../../src/domain/user'
import {
  createIdpClientConfig,
  createIdpIssuerConfig,
  getIdpConfig
} from '../../../src/idp/service/helpers'
import { expect } from '../../test-utils'
import { testConfig } from '../../test-utils/module-for-testing'

describe('Helpers', () => {
  const configService = testConfig()

  describe('getIdpConfigIdentifier', () => {
    it('renvoie miloJeune', () => {
      expect(
        getIdpConfig(configService, User.Type.JEUNE, User.Structure.MILO).issuer
      ).to.equal('milo-jeune.com')
    })
    it('renvoie miloJeune', () => {
      expect(
        getIdpConfig(configService, User.Type.BENEFICIAIRE, User.Structure.MILO)
          .issuer
      ).to.equal('milo-jeune.com')
    })
    it('renvoie miloConseiller', () => {
      expect(
        getIdpConfig(configService, User.Type.CONSEILLER, User.Structure.MILO)
          .issuer
      ).to.equal('https://sso-qlf.i-milo.fr/auth/realms/imilo-qualif')
    })
    it('renvoie conseillerDept', () => {
      expect(
        getIdpConfig(
          configService,
          User.Type.CONSEILLER,
          User.Structure.CONSEIL_DEPT
        ).issuer
      ).to.equal('https://keycloak-cej.com')
    })
    it('renvoie francetravailConseiller', () => {
      expect(
        getIdpConfig(
          configService,
          User.Type.CONSEILLER,
          User.Structure.FRANCE_TRAVAIL
        ).issuer
      ).to.equal('ft-conseiller.com')
    })
    it('renvoie francetravailConseiller', () => {
      expect(
        getIdpConfig(
          configService,
          User.Type.CONSEILLER,
          User.Structure.POLE_EMPLOI_CEJ
        ).issuer
      ).to.equal('ft-conseiller.com')
    })
    it('renvoie francetravailConseiller', () => {
      expect(
        getIdpConfig(
          configService,
          User.Type.CONSEILLER,
          User.Structure.POLE_EMPLOI_BRSA
        ).issuer
      ).to.equal('ft-conseiller.com')
    })
    it('renvoie francetravailBeneficiaire', () => {
      expect(
        getIdpConfig(
          configService,
          User.Type.BENEFICIAIRE,
          User.Structure.FRANCE_TRAVAIL
        ).issuer
      ).to.equal('ft-jeune.com')
    })
    it('renvoie francetravailBeneficiaire', () => {
      expect(
        getIdpConfig(
          configService,
          User.Type.BENEFICIAIRE,
          User.Structure.CONSEIL_DEPT
        ).issuer
      ).to.equal('ft-jeune.com')
    })
    it('renvoie francetravailBeneficiaire', () => {
      expect(
        getIdpConfig(
          configService,
          User.Type.BENEFICIAIRE,
          User.Structure.POLE_EMPLOI_CEJ
        ).issuer
      ).to.equal('ft-jeune.com')
    })
    it('renvoie francetravailBeneficiaire', () => {
      expect(
        getIdpConfig(
          configService,
          User.Type.JEUNE,
          User.Structure.POLE_EMPLOI_CEJ
        ).issuer
      ).to.equal('ft-jeune.com')
    })
    it('renvoie francetravailBeneficiaire', () => {
      expect(
        getIdpConfig(
          configService,
          User.Type.JEUNE,
          User.Structure.FRANCE_TRAVAIL
        ).issuer
      ).to.equal('ft-jeune.com')
    })
  })

  describe('createIdpIssuerConfig', () => {
    const idp = getIdpConfig(
      configService,
      User.Type.CONSEILLER,
      User.Structure.MILO
    )
    const issuerConfig = {
      issuer: idp.issuer,
      authorization_endpoint: idp.authorizationUrl,
      token_endpoint: idp.tokenUrl,
      jwks_uri: idp.jwks,
      userinfo_endpoint: idp.userinfo
    }
    it('renvoie issuerConfig', () => {
      expect(createIdpIssuerConfig(idp)).to.deep.equal(issuerConfig)
    })
  })
  describe('createIdpClientConfig', () => {
    const idp = getIdpConfig(
      configService,
      User.Type.CONSEILLER,
      User.Structure.MILO
    )
    const clientConfig = {
      client_id: idp.clientId,
      client_secret: idp.clientSecret,
      redirect_uris: [idp.redirectUri],
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      scope: idp.scopes,
      token_endpoint_auth_method: 'client_secret_post'
    }
    it('renvoie issuerConfig', () => {
      expect(createIdpClientConfig(idp)).to.deep.equal(clientConfig)
    })
  })
})
