import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { User, UserAccount } from '../domain/user'
import { Account } from '../domain/account'
import { firstValueFrom } from 'rxjs'

export interface UserInfoAPI {
  nom?: string
  prenom?: string
  email?: string
  type: User.Type
  structure: User.Structure
  username?: string
}

@Injectable()
export class PassEmploiAPIService {
  private readonly logger: Logger
  private readonly apiUrl: string
  private readonly apiKey: string

  constructor(
    private readonly configService: ConfigService,
    private httpService: HttpService
  ) {
    this.logger = new Logger('PassEmploiAPIService')
    this.apiUrl = this.configService.get('passemploiapi.url')!
    this.apiKey = this.configService.get('passemploiapi.key')!
  }

  async putUser(
    sub: string,
    userInfoAPI: UserInfoAPI
  ): Promise<User | undefined> {
    try {
      const apiUser = await firstValueFrom(
        this.httpService.put(`${this.apiUrl}/auth/users/${sub}`, userInfoAPI, {
          headers: {
            'X-API-KEY': this.apiKey
          }
        })
      )

      const user: User = {
        userId: apiUser.data.id,
        userType: apiUser.data.type,
        userStructure: apiUser.data.structure,
        userRoles: apiUser.data.roles,
        given_name: apiUser.data.prenom,
        family_name: apiUser.data.nom,
        email: apiUser.data.email,
        preferred_username: apiUser.data.username
      }
      return user
    } catch (e) {
      this.logger.error(e)
      return undefined
    }
  }

  async getUser(userAccount: UserAccount): Promise<User | undefined> {
    try {
      const apiUser = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/auth/users/${userAccount.sub}`, {
          params: {
            typeUtilisateur: userAccount.type,
            structureUtilisateur: userAccount.structure
          },
          headers: {
            'X-API-KEY': this.apiKey
          }
        })
      )

      const user: User = {
        userId: apiUser.data.id,
        userType: userAccount.type,
        userStructure: userAccount.structure,
        userRoles: apiUser.data.roles,
        given_name: apiUser.data.prenom,
        family_name: apiUser.data.nom,
        email: apiUser.data.email,
        preferred_username: apiUser.data.username
      }
      return user
    } catch (e) {
      this.logger.error(e)
      return undefined
    }
  }
}
