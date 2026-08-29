import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRepository } from '../../../../interfaces/user-repository.interface.js';
import { User } from '../../../../domain/user.entity.js';
import {
  UserDocument,
  UserSchemaClass,
} from '../schemas/user.schema.js';
import { UserMapper } from '../mappers/user.mapper.js';

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await this.userModel.findById(id).exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async create(user: Pick<User, 'email' | 'passwordHash'>): Promise<User> {
    const created = await this.userModel.create({
      email: user.email.toLowerCase().trim(),
      passwordHash: user.passwordHash,
    });
    return UserMapper.toDomain(created);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      return;
    }
    await this.userModel.findByIdAndUpdate(userId, { passwordHash }).exec();
  }

  async markEmailVerified(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      return;
    }
    await this.userModel
      .findByIdAndUpdate(userId, { emailVerifiedAt: new Date() })
      .exec();
  }
}
