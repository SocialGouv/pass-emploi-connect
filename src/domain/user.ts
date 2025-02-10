export interface User {
  // venant de l'API
  userId: string
  userType: User.Type
  userStructure: User.Structure
  userRoles: string[]
  // venant de l'IDP
  given_name: string
  family_name: string
  email: string
  preferred_username?: string
}

export namespace User {
  export enum Type {
    JEUNE = 'JEUNE',
    BENEFICIAIRE = 'BENEFICIAIRE',
    CONSEILLER = 'CONSEILLER'
  }

  export enum Structure {
    MILO = 'MILO',
    POLE_EMPLOI_CEJ = 'POLE_EMPLOI',
    POLE_EMPLOI_BRSA = 'POLE_EMPLOI_BRSA',
    POLE_EMPLOI_AIJ = 'POLE_EMPLOI_AIJ',
    FRANCE_TRAVAIL = 'FRANCE_TRAVAIL',
    CONSEIL_DEPT = 'CONSEIL_DEPT',
    AVENIR_PRO = 'AVENIR_PRO',
    FT_ACCOMPAGNEMENT_INTENSIF = 'FT_ACCOMPAGNEMENT_INTENSIF'
  }
}

function estFT(userStructure: User.Structure): boolean {
  return [
    User.Structure.POLE_EMPLOI_CEJ,
    User.Structure.POLE_EMPLOI_AIJ,
    User.Structure.POLE_EMPLOI_BRSA,
    User.Structure.FRANCE_TRAVAIL,
    User.Structure.FT_ACCOMPAGNEMENT_INTENSIF
  ].includes(userStructure)
}
function estConseiller(userType: User.Type): boolean {
  return userType === User.Type.CONSEILLER
}
function estBeneficiaire(userType: User.Type): boolean {
  return [User.Type.JEUNE, User.Type.BENEFICIAIRE].includes(userType)
}

export function estBeneficiaireFT(
  userType: User.Type,
  userStructure: User.Structure
): boolean {
  return estBeneficiaire(userType) && estFT(userStructure)
}
export function estConseillerFT(
  userType: User.Type,
  userStructure: User.Structure
): boolean {
  return estConseiller(userType) && estFT(userStructure)
}
export function estConseillerDept(
  userType: User.Type,
  userStructure: User.Structure
): boolean {
  return (
    estConseiller(userType) && userStructure === User.Structure.CONSEIL_DEPT
  )
}
