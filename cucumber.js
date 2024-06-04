'use strict'

module.exports = {
  default: {
    paths: ['test/integration/features/*.feature'],
    requireModule: ['ts-node/register' /*'tsconfig-paths/register'*/],
    require: ['test/integration/steps-definitions/*.ts']
  }
}
