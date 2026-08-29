import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SessionRepository } from '../../../../interfaces/session-repository.interface.js';
import { Session } from '../../../../domain/session.entity.js';
import {
  SessionDocument,
  SessionSchemaClass,
} from '../schemas/session.schema.js';
import { SessionMapper } from '../mappers/session.mapper.js';

@Injectable()
export class MongoSessionRepository implements SessionRepository {
  constructor(
    @InjectModel(SessionSchemaClass.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async create(
    session: Omit<Session, 'id' | 'createdAt' | 'lastUsedAt' | 'isExpired'>,
  ): Promise<Session> {
    const created = await this.sessionModel.create({
      userId: new Types.ObjectId(session.userId),
      tokenHash: session.tokenHash,
      userAgent: session.userAgent ?? null,
      ip: session.ip ?? null,
      rememberMe: session.rememberMe ?? null,
      expiresAt: session.expiresAt,
      lastUsedAt: new Date(),
    });
    return SessionMapper.toDomain(created);
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const doc = await this.sessionModel.findOne({ tokenHash }).exec();
    return doc ? SessionMapper.toDomain(doc) : null;
  }

  async touch(sessionId: string, lastUsedAt: Date): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return;
    }
    await this.sessionModel
      .findByIdAndUpdate(sessionId, { lastUsedAt })
      .exec();
  }

  async deleteById(sessionId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      return;
    }
    await this.sessionModel.findByIdAndDelete(sessionId).exec();
  }

  async deleteAllForUser(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      return;
    }
    await this.sessionModel
      .deleteMany({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async deleteExpired(now: Date): Promise<void> {
    await this.sessionModel
      .deleteMany({ expiresAt: { $lte: now } })
      .exec();
  }
}
