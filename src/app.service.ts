import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Error as MongooseError } from 'mongoose';
interface MongoDuplicateKeyError extends Error {
  code: number;
  keyValue: Record<string, unknown>;
}

function isMongoDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return (
    err instanceof Error &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  );
}
@Schema({ collection: 'tests', timestamps: true })
export class MongoTestSchemaClass {
  @Prop({
    trim: true,
    required: true,
    unique: true,
  })
  text: string;
}

export const MongoTestSchema =
  SchemaFactory.createForClass(MongoTestSchemaClass);

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(
    @InjectModel(MongoTestSchemaClass.name)
    private readonly testModel: Model<HydratedDocument<MongoTestSchemaClass>>,
  ) {}

  async getHelloWorld(text: string) {
    try {
      const created = await this.testModel.create({ text });
      if (created.errors) {
        this.logger.error(created.errors);
      }
      return {
        id: created._id,
        text,
        error: created.errors,
      };
    } catch (err) {
      if (err instanceof MongooseError.ValidationError) {
        this.logger.error(`Validation failed: ${err.message}`);
        throw new BadRequestException(err.message);
      }

      if (isMongoDuplicateKeyError(err)) {
        this.logger.error(`Duplicate key: ${JSON.stringify(err.keyValue)}`);
        throw new ConflictException(`text "${text}" already exists`);
      }

      this.logger.error(err);
      throw new InternalServerErrorException();
    }
  }
}
