import { Identity } from '../../../../domain/identity.entity.js';
import { IdentityDocument } from '../schemas/identity.schema.js';

export class IdentityMapper {
  static toDomain(doc: IdentityDocument): Identity {
    return new Identity({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      provider: doc.provider,
      providerAccountId: doc.providerAccountId,
      accessToken: doc.accessToken ?? null,
      refreshToken: doc.refreshToken ?? null,
      createdAt: doc.createdAt,
    });
  }
}
