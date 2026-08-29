import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { type AuthProvider } from '../../../../domain/identity.entity.js';

export type IdentityDocument = HydratedDocument<IdentitySchemaClass>;

@Schema({
  collection: 'identities',
  timestamps: { createdAt: true, updatedAt: false },
})
export class IdentitySchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: 'UserSchemaClass',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['credentials', 'google'] })
  provider: AuthProvider;

  @Prop({ type: String, required: true })
  providerAccountId: string;

  @Prop({ type: String, default: null })
  accessToken: string | null;

  @Prop({ type: String, default: null })
  refreshToken: string | null;

  createdAt: Date;
}

export const IdentitySchema = SchemaFactory.createForClass(IdentitySchemaClass);

IdentitySchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
