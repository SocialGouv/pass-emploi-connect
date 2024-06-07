import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { HealthCheckResult } from '@nestjs/terminus/dist/health-check/health-check-result.interface'

@Controller()
export class AppController {
  constructor(private health: HealthCheckService) {}

  @Get()
  getHello(): string {
    return 'Pass Emploi Connect'
  }
  @Get('health')
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([])
  }
}
