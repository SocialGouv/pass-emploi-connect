export interface DomainError {
  readonly code: string
  readonly message: string
}

export class NonTrouveError implements DomainError {
  static CODE = 'NON_TROUVE'
  readonly code: string = NonTrouveError.CODE
  readonly message: string

  constructor(entityType: string, critereRecherche = '') {
    this.message = `${entityType} ${critereRecherche} non trouvé(e)`
  }
}

export class NonTraitable implements DomainError {
  static CODE = 'NON_TRAITABLE'
  readonly code: string = NonTraitable.CODE
  readonly message: string

  constructor(
    nonTraitableCode: NonTraitableCode = NonTraitableCode.NON_TRAITABLE
  ) {
    this.message = mapNonTraitableMessage[nonTraitableCode]
  }
}

export enum NonTraitableCode {
  NON_TRAITABLE = 'NON_TRAITABLE',
  UTILISATEUR_INEXISTANT = 'UTILISATEUR_INEXISTANT',
  UTILISATEUR_DEJA_MILO = 'UTILISATEUR_DEJA_MILO',
  UTILISATEUR_NOUVEAU_MILO = 'UTILISATEUR_NOUVEAU_MILO',
  UTILISATEUR_DEJA_PE = 'UTILISATEUR_DEJA_PE',
  UTILISATEUR_NOUVEAU_PE = 'UTILISATEUR_NOUVEAU_PE',
  UTILISATEUR_DEJA_PE_BRSA = 'UTILISATEUR_DEJA_PE_BRSA',
  UTILISATEUR_NOUVEAU_PE_BRSA = 'UTILISATEUR_NOUVEAU_PE_BRSA'
}

const mapNonTraitableMessage: Record<NonTraitableCode, string> = {
  NON_TRAITABLE: 'Utilisateur non traitable',
  UTILISATEUR_INEXISTANT:
    'Aucun utilisateur trouvé, veuillez contacter votre conseiller',
  UTILISATEUR_DEJA_MILO:
    'Veuillez vous connecter en choisissant Mission Locale',
  UTILISATEUR_NOUVEAU_MILO:
    'Veuillez vous connecter en choisissant Mission Locale',
  UTILISATEUR_DEJA_PE: 'Veuillez vous connecter en choisissant France Travail',
  UTILISATEUR_NOUVEAU_PE:
    'Veuillez vous connecter en choisissant France Travail',
  UTILISATEUR_DEJA_PE_BRSA:
    'Veuillez vous connecter en choisissant France Travail BRSA',
  UTILISATEUR_NOUVEAU_PE_BRSA:
    'Veuillez vous connecter en choisissant France Travail BRSA'
}