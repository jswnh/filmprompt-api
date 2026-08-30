import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Post('/test')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 2, ttl: 10000 } })
  getHelloWorld(@Body() body: { text: string }) {
    return this.appService.getHelloWorld(body.text);
  }
}
