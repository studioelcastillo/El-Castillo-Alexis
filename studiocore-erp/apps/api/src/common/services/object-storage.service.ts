import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type UploadObjectInput = {
  bucket?: string | null;
  key: string;
  body: Buffer;
  contentType?: string | null;
  contentDisposition?: string | null;
};

@Injectable()
export class ObjectStorageService {
  private readonly client: S3Client;
  private readonly defaultBucket: string;

  constructor() {
    this.defaultBucket = process.env.S3_BUCKET || 'el-castillo';
    this.client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials: process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
          }
        : undefined,
    });
  }

  getDefaultBucket() {
    return this.defaultBucket;
  }

  async uploadObject(input: UploadObjectInput) {
    const bucket = input.bucket || this.defaultBucket;
    await this.ensureBucket(bucket);

    try {
      await this.client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType || undefined,
        ContentDisposition: input.contentDisposition || undefined,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Object storage upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return {
      bucket,
      key: input.key,
      publicUrl: this.buildPublicUrl(bucket, input.key),
    };
  }

  async getSignedObjectUrl(bucket: string | null | undefined, key: string | null | undefined, expiresIn = 900) {
    if (!bucket || !key) {
      throw new BadRequestException('Storage bucket and path are required');
    }

    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Object storage access failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async ensureBucket(bucket: string) {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      return;
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
      } catch (error) {
        throw new InternalServerErrorException(
          `Unable to ensure bucket ${bucket}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  private buildPublicUrl(bucket: string, key: string) {
    const explicitBase = process.env.S3_PUBLIC_BASE_URL?.trim();
    if (explicitBase) {
      return `${explicitBase.replace(/\/$/, '')}/${bucket}/${key}`;
    }

    const endpoint = process.env.S3_ENDPOINT?.trim();
    if (!endpoint) {
      return null;
    }

    return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
  }
}
