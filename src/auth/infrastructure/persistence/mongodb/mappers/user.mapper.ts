import { User } from '../../../../domain/user.entity.js';
import { UserDocument } from '../schemas/user.schema.js';

export class UserMapper {
  static toDomain(doc: UserDocument): User {
    return new User({
      id: doc._id.toString(),
      email: doc.email,
      passwordHash: doc.passwordHash ?? null,
      emailVerifiedAt: doc.emailVerifiedAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
