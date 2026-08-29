import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<SessionSchemaClass>;

@Schema({
  collection: 'sessions',
  timestamps: { createdAt: true, updatedAt: false },
})
export class SessionSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: 'UserSchemaClass',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  tokenHash: string;

  @Prop({ type: String, default: null })
  userAgent: string | null;

  @Prop({ type: String, default: null })
  ip: string | null;

  @Prop({ type: Number, default: null })
  rememberMe: number | null;

  @Prop({ type: Date, required: true, index: { expires: 0 } })
  expiresAt: Date;

  @Prop({ type: Date, default: Date.now })
  lastUsedAt: Date;

  createdAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(SessionSchemaClass);
