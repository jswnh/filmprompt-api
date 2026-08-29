import { AuthProvider, Identity } from '../domain/identity.entity.js';

export const IDENTITY_REPOSITORY = Symbol('IDENTITY_REPOSITORY');

export interface IdentityRepository {
  findByProvider(
    provider: AuthProvider,
    providerAccountId: string,
  ): Promise<Identity | null>;
  create(identity: Omit<Identity, 'id' | 'createdAt'>): Promise<Identity>;
  linkToUser(
    userId: string,
    identity: Omit<Identity, 'id' | 'createdAt' | 'userId'>,
  ): Promise<Identity>;
}
