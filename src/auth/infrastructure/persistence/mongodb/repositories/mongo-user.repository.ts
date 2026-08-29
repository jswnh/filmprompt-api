import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateUserInput,
  UserRepository,
  UserWithPassword,
} from '../../../../interfaces/user-repository.interface.js';
import { User } from '../../../../domain/user.entity.js';
import { UserDocument, UserSchemaClass } from '../schemas/user.schema.js';
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

  async findWithPasswordByEmail(
    email: string,
  ): Promise<UserWithPassword | null> {
    const doc = await this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .exec();
    if (!doc) {
      return null;
    }
    return {
      user: UserMapper.toDomain(doc),
      passwordHash: doc.passwordHash ?? null,
    };
  }

  async create(user: CreateUserInput): Promise<User> {
    const { passwordHash, ...profile } = user;
    const created = await this.userModel.create({
      ...profile,
      email: user.email.toLowerCase().trim(),
      passwordHash: passwordHash ?? null,
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
      .findByIdAndUpdate(userId, {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      })
      .exec();
  }

  async findByEmailVerificationTokenHash(
    tokenHash: string,
  ): Promise<User | null> {
    const doc = await this.userModel
      .findOne({ emailVerificationTokenHash: tokenHash })
      .exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
    const doc = await this.userModel
      .findOne({ passwordResetTokenHash: tokenHash })
      .exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async setEmailVerificationToken(
    userId: string,
    tokenHash: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      return;
    }
    await this.userModel
      .findByIdAndUpdate(userId, {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      })
      .exec();
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string | null,
    expiresAt: Date | null,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      return;
    }
    await this.userModel
      .findByIdAndUpdate(userId, {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      })
      .exec();
  }
}
