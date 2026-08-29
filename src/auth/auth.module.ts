import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  USER_REPOSITORY,
  UserRepository,
} from './interfaces/user-repository.interface.js';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from './interfaces/session-repository.interface.js';
import authConfig from './config/auth.config.js';
import { AuthController } from './controllers/auth.controller.js';
import { PasswordHasherService } from './services/password-hasher.service.js';
import { SessionService } from './services/session.service.js';
import { AuthService } from './services/auth.service.js';
import { SessionGuard } from './guards/session.guard.js';

const AUTH_REPOSITORIES = Symbol('AUTH_REPOSITORIES');

export interface AuthRepositories {
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
}

export interface AuthModuleAsyncOptions {
  imports?: Array<Type<unknown> | DynamicModule>;
  inject?: Array<string | symbol | Type<unknown>>;
  useFactory: (
    ...args: unknown[]
  ) => Promise<AuthRepositories> | AuthRepositories;
}

@Module({})
export class AuthModule {
  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    const repositoriesProvider: Provider = {
      provide: AUTH_REPOSITORIES,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const userRepositoryProvider: Provider = {
      provide: USER_REPOSITORY,
      useFactory: (repos: AuthRepositories) => repos.userRepository,
      inject: [AUTH_REPOSITORIES],
    };

    const sessionRepositoryProvider: Provider = {
      provide: SESSION_REPOSITORY,
      useFactory: (repos: AuthRepositories) => repos.sessionRepository,
      inject: [AUTH_REPOSITORIES],
    };

    return {
      module: AuthModule,
      imports: [
        ConfigModule.forFeature(authConfig),
        ...(options.imports ?? []),
      ],
      controllers: [AuthController],
      providers: [
        repositoriesProvider,
        userRepositoryProvider,
        sessionRepositoryProvider,
        AuthService,
        PasswordHasherService,
        SessionService,
        SessionGuard,
      ],
      exports: [AuthService, SessionService, SessionGuard],
    };
  }
}
