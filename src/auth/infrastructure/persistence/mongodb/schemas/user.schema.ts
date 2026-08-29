import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserSchemaClass>;

@Schema({ collection: 'users', timestamps: true })
export class UserSchemaClass {
  // ==========================================================================
  // 🔒 ORIGIN SYSTEM & AUTH FIELDS (DO NOT REMOVE)
  // ==========================================================================
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ type: String, default: null })
  passwordHash: string | null;

  @Prop({ type: Date, default: null })
  emailVerifiedAt: Date | null;

  @Prop({ type: String, default: null, index: true })
  emailVerificationTokenHash: string | null;

  @Prop({ type: Date, default: null })
  emailVerificationExpiresAt: Date | null;

  @Prop({ type: String, default: null, index: true })
  passwordResetTokenHash: string | null;

  @Prop({ type: Date, default: null })
  passwordResetExpiresAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  // ==========================================================================
  // ➕ CUSTOMIZABLE FIELDS (ADD / REMOVE YOUR MONGO PROPERTIES HERE)
  // Examples:
  // @Prop({ type: String, default: null, trim: true })
  // name: string | null;
  //
  // @Prop({ type: String, default: null })
  // avatarUrl: string | null;
  // ==========================================================================
}

export const UserSchema = SchemaFactory.createForClass(UserSchemaClass);
