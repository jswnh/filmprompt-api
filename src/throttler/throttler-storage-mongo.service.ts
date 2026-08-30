import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThrottlerRecord } from './throttler-record.schema.js';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface.js';

@Injectable()
export class ThrottlerStorageMongoService implements ThrottlerStorage {
  constructor(
    @InjectModel(ThrottlerRecord.name)
    private readonly recordModel: Model<ThrottlerRecord>,
  ) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const compositeKey = `${key}-${throttlerName}`;
    const now = Date.now();

    let doc = await this.recordModel.findOne({ key: compositeKey });

    if (!doc) {
      doc = new this.recordModel({
        key: compositeKey,
        hits: [],
        isBlocked: false,
        expiresAt: new Date(now + ttl),
      });
    }

    // Drop expired hits (outside the current TTL window)
    doc.hits = doc.hits.filter((t) => t > now - ttl);

    // Handle an active block
    if (doc.isBlocked && doc.blockExpiresAt && doc.blockExpiresAt > now) {
      return {
        totalHits: doc.hits.length,
        timeToExpire: Math.ceil((doc.hits[0] + ttl - now) / 1000) || 0,
        isBlocked: true,
        timeToBlockExpire: Math.ceil((doc.blockExpiresAt - now) / 1000),
      };
    }

    // Register this hit
    doc.hits.push(now);
    doc.isBlocked = doc.hits.length > limit;

    if (doc.isBlocked && blockDuration > 0) {
      doc.blockExpiresAt = now + blockDuration;
    }

    doc.expiresAt = new Date(
      now + Math.max(ttl, doc.isBlocked ? blockDuration : 0),
    );

    await doc.save();

    return {
      totalHits: doc.hits.length,
      timeToExpire: Math.ceil((doc.hits[0] + ttl - now) / 1000),
      isBlocked: doc.isBlocked,
      timeToBlockExpire: doc.blockExpiresAt
        ? Math.ceil((doc.blockExpiresAt - now) / 1000)
        : 0,
    };
  }
}
