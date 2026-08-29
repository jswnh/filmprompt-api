import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserSchemaClass,
  UserSchema,
} from './schemas/user.schema.js';
import {
  SessionSchemaClass,
  SessionSchema,
} from './schemas/session.schema.js';
import {
  IdentitySchemaClass,
  IdentitySchema,
} from './schemas/identity.schema.js';
import { MongoUserRepository } from './repositories/mongo-user.repository.js';
import { MongoSessionRepository } from './repositories/mongo-session.repository.js';
import { MongoIdentityRepository } from './repositories/mongo-identity.repository.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSchemaClass.name, schema: UserSchema },
      { name: SessionSchemaClass.name, schema: SessionSchema },
      { name: IdentitySchemaClass.name, schema: IdentitySchema },
    ]),
  ],
  providers: [
    MongoUserRepository,
    MongoSessionRepository,
    MongoIdentityRepository,
  ],
  exports: [
    MongoUserRepository,
    MongoSessionRepository,
    MongoIdentityRepository,
  ],
})
export class AuthPersistenceModule {}
