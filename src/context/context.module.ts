import { Module } from '@nestjs/common'

import { Context } from './context.provider'

@Module({
  imports: [],
  providers: [Context],
  exports: [Context]
})
export class ContextModule {}
