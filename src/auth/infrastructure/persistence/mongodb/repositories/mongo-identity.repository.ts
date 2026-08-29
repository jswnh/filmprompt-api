import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IdentityRepository } from '../../../../interfaces/identity-repository.interface.js';
import {
  AuthProvider,
  Identity,
} from '../../../../domain/identity.entity.js';
import {
  IdentityDocument,
  IdentitySchemaClass,
} from '../schemas/identity.schema.js';
import { IdentityMapper } from '../mappers/identity.mapper.js';

@Injectable()
export class MongoIdentityRepository implements IdentityRepository {
  constructor(
    @InjectModel(IdentitySchemaClass.name)
    private readonly identityModel: Model<IdentityDocument>,
  ) {}

  async findByProvider(
    provider: AuthProvider,
    providerAccountId: string,
  ): Promise<Identity | null> {
    const doc = await this.identityModel
      .findOne({ provider, providerAccountId })
      .exec();
    return doc ? IdentityMapper.toDomain(doc) : null;
  }

  async create(
    identity: Omit<Identity, 'id' | 'createdAt'>,
  ): Promise<Identity> {
    const created = await this.identityModel.create({
      userId: new Types.ObjectId(identity.userId),
      provider: identity.provider,
      providerAccountId: identity.providerAccountId,
      accessToken: identity.accessToken,
      refreshToken: identity.refreshToken,
    });
    return IdentityMapper.toDomain(created);
  }

  async linkToUser(
    userId: string,
    identity: Omit<Identity, 'id' | 'createdAt' | 'userId'>,
  ): Promise<Identity> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error(`Invalid userId ObjectId: ${userId}`);
    }
    const created = await this.identityModel.create({
      userId: new Types.ObjectId(userId),
      provider: identity.provider,
      providerAccountId: identity.providerAccountId,
      accessToken: identity.accessToken,
      refreshToken: identity.refreshToken,
    });
    return IdentityMapper.toDomain(created);
  }
}
