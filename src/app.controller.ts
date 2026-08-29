import {
  Body,
  Controller,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Post('/test')
  getHelloWorld(@Body() body: { text: string }) {
    return this.appService.getHelloWorld(body.text);
  }
}
