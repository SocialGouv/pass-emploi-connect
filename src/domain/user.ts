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
    CONSEILLER = 'CONSEILLER'
  }

  export enum Structure {
    MILO = 'MILO',
    POLE_EMPLOI = 'POLE_EMPLOI',
    POLE_EMPLOI_BRSA = 'POLE_EMPLOI_BRSA',
    POLE_EMPLOI_AIJ = 'POLE_EMPLOI_AIJ'
  }
}
