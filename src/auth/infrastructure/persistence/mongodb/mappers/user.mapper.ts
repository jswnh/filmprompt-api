import {
  User,
  UserProfile,
  UserSystemFields,
} from '../../../../domain/user.entity.js';
import { UserDocument } from '../schemas/user.schema.js';

export class UserMapper {
  static toDomain(doc: UserDocument): User {
    const profile: UserProfile = {
      // 🔒 Origin field:
      email: doc.email,

      // ➕ Custom fields mapped from Mongo document:
      // name: doc.name,
      // avatarUrl: doc.avatarUrl ?? null,
    };

    // ========================================================================
    // 🔒 ORIGIN SYSTEM FIELDS (DO NOT REMOVE)
    // ========================================================================
    const system: UserSystemFields = {
      id: doc._id.toString(),
      emailVerifiedAt: doc.emailVerifiedAt ?? null,
      emailVerificationTokenHash: doc.emailVerificationTokenHash ?? null,
      emailVerificationExpiresAt: doc.emailVerificationExpiresAt ?? null,
      passwordResetTokenHash: doc.passwordResetTokenHash ?? null,
      passwordResetExpiresAt: doc.passwordResetExpiresAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    return new User({
      ...profile,
      ...system,
    });
  }
}
