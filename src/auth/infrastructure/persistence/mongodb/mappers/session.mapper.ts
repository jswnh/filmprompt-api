import { Session } from '../../../../domain/session.entity.js';
import { SessionDocument } from '../schemas/session.schema.js';

export class SessionMapper {
  static toDomain(doc: SessionDocument): Session {
    return new Session({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      tokenHash: doc.tokenHash,
      userAgent: doc.userAgent ?? null,
      ip: doc.ip ?? null,
      rememberMe: doc.rememberMe ?? null,
      expiresAt: doc.expiresAt,
      lastUsedAt: doc.lastUsedAt,
      createdAt: doc.createdAt,
    });
  }
}
