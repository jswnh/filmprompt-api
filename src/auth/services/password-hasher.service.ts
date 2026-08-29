import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import authConfig from '../config/auth.config.js';

@Injectable()
export class PasswordHasherService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.config.bcryptSaltRounds);
  }

  verify(hash: string, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}
