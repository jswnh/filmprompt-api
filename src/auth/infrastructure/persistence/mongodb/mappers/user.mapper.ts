import {
  User,
  UserProfile,
  UserSystemFields,
} from '../../../../domain/user.entity.js';
import { UserDocument } from '../schemas/user.schema.js';

export class UserMapper {
  static toDomain(doc: UserDocument): User {
    // 💡 Strict typing: If you add a field to userProfileSchema,
    // TypeScript will immediately turn RED here until you map it!
    const profile: UserProfile = {
      email: doc.email,
    };

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
