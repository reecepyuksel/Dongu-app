import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ops/status')
  async getOpsStatus(@Headers('x-ops-token') opsToken?: string) {
    const expectedToken = process.env.OPS_STATUS_TOKEN;

    if (expectedToken && opsToken !== expectedToken) {
      throw new UnauthorizedException('Ops token gecersiz');
    }

    return this.appService.getOpsStatus();
  }
}
