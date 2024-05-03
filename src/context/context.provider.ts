import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'node:async_hooks'
import { User } from '../domain/user'

export type ContextData = Map<string, unknown>

export enum ContextKeyType {
  ISSUER = 'ISSUER',
  CLIENT = 'CLIENT'
}
export interface ContextKey {
  userType: User.Type
  userStructure: User.Structure
  key: ContextKeyType
}

@Injectable()
export class Context {
  private asyncLocalStorage: AsyncLocalStorage<ContextData>

  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage()
    this.start()
  }

  start(): void {
    this.asyncLocalStorage.enterWith(new Map<string, unknown>())
  }

  get<T>(key: ContextKey): T {
    return this.asyncLocalStorage
      .getStore()
      ?.get(fromKeyObjectToString(key)) as T
  }

  set(key: ContextKey, value: unknown): void {
    this.asyncLocalStorage.getStore()?.set(fromKeyObjectToString(key), value)
  }
}

function fromKeyObjectToString(key: ContextKey): string {
  return Object.values(key).join('-')
}
