import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SearchDocument = HydratedDocument<SearchSchemaClass>;

@Schema({ collection: 'searches', timestamps: true })
export class SearchSchemaClass {
  // 👤 User relation (ObjectId referencing UserSchemaClass, null if guest)
  @Prop({
    type: Types.ObjectId,
    ref: 'UserSchemaClass',
    default: null,
    index: true,
  })
  userId: Types.ObjectId | null;

  // 🔍 Keyword search or AI prompt
  @Prop({ required: true, trim: true })
  query: string;

  // 🏷️ Genre Pills / Filters (e.g. ['Action', 'Sci-Fi'] or ['28', '878'])
  @Prop({ type: [String], default: [] })
  genres: string[];

  // 🤖 Search engine type: standard TMDB catalog search or AI prompt search
  @Prop({
    type: String,
    enum: ['standard', 'ai'],
    default: 'standard',
    index: true,
  })
  type: 'standard' | 'ai';

  // 📅 Year filter (optional)
  @Prop({ type: Number, default: null })
  year: number | null;

  // ⭐ Minimum rating filter (optional)
  @Prop({ type: Number, default: null })
  minRating: number | null;

  // 📊 Sorting option used
  @Prop({ type: String, default: 'popularity.desc' })
  sortBy: string;

  // 🔢 Number of results returned from TMDB / AI
  @Prop({ type: Number, default: 0 })
  resultsCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const SearchSchema = SchemaFactory.createForClass(SearchSchemaClass);

// Fast compound index for fetching recent search history by user:
SearchSchema.index({ userId: 1, createdAt: -1 });
