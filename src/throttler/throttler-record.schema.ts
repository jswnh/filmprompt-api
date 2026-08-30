import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'throttler_records' })
export class ThrottlerRecord extends Document {
  @Prop({ required: true, index: true })
  key: string;

  @Prop({ required: true })
  hits: number[];

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop()
  blockExpiresAt?: number;

  @Prop({ expires: 0 })
  expiresAt: Date;
}

export const ThrottlerRecordSchema =
  SchemaFactory.createForClass(ThrottlerRecord);
