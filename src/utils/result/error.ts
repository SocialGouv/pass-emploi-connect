export interface DomainError {
  readonly code: string
  readonly message: string
  readonly reason?: string
}

export class AuthError implements DomainError {
  static CODE = 'AUTH_ERROR'
  code: string = AuthError.CODE
  readonly reason: string
  readonly message: string

  constructor(reason: string) {
    this.message = reason
    this.reason = reason
  }
}

export class JWTError implements DomainError {
  static CODE = 'JWT_ERROR'
  code: string = JWTError.CODE
  readonly message: string

  constructor(code: string) {
    this.message = `JWT Error`
    this.code = code
  }
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
  readonly reason: NonTraitableReason
  readonly message: string

  constructor(reason?: string) {
    this.reason =
      reason &&
      Object.values(NonTraitableReason).includes(reason as NonTraitableReason)
        ? (reason as NonTraitableReason)
        : NonTraitableReason.NON_TRAITABLE
    this.message = mapNonTraitableMessage[this.reason]
  }
}

export enum NonTraitableReason {
  NON_TRAITABLE = 'NON_TRAITABLE',
  UTILISATEUR_INEXISTANT = 'UTILISATEUR_INEXISTANT',
  UTILISATEUR_DEJA_MILO = 'UTILISATEUR_DEJA_MILO',
  UTILISATEUR_NOUVEAU_MILO = 'UTILISATEUR_NOUVEAU_MILO',
  UTILISATEUR_DEJA_PE = 'UTILISATEUR_DEJA_PE',
  UTILISATEUR_NOUVEAU_PE = 'UTILISATEUR_NOUVEAU_PE',
  UTILISATEUR_DEJA_PE_BRSA = 'UTILISATEUR_DEJA_PE_BRSA',
  UTILISATEUR_NOUVEAU_PE_BRSA = 'UTILISATEUR_NOUVEAU_PE_BRSA',
  UTILISATEUR_CONSEILLER_MAUVAISE_STRUCTURE = 'UTILISATEUR_CONSEILLER_MAUVAISE_STRUCTURE'
}

const mapNonTraitableMessage: Record<NonTraitableReason, string> = {
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
    'Veuillez vous connecter en choisissant France Travail BRSA',
  UTILISATEUR_CONSEILLER_MAUVAISE_STRUCTURE:
    'Veuillez vous connecter avec une autre méthode'
}
