import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from 'src/common/utils/env.utils';
import {
  AppError,
  BadRequestError,
  InternalError,
} from 'src/types/error.types';
import { Log } from 'src/common/decorators/logger.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

export interface PresignedUrlResult {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  expiresIn: number;
}

export interface PresignedUrlWithThumbnailResult {
  main: PresignedUrlResult;
  thumbnail: PresignedUrlResult;
}

export interface RecordFileResult {
  id: string;
  fileKey: string;
  url: string;
  thumbnailKey: string | null;
  thumbnailUrl: string;
  category: string;
  contentType: string;
  createdAt: Date;
  userId: string;
}

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  // based on bytes
  private readonly MAX_FILE_SIZES = {
    'shop-image': 1 * 1024 * 1024, // 1 MB
    'shop-thumbnail': 700 * 1024, // 100 KB
    'image-thumbnail': 150 * 1024, // 150 KB
  } as const;

  constructor(private readonly prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: env('R2_ENDPOINT'),
      credentials: {
        accessKeyId: env('R2_ACCESS_KEY_ID'),
        secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
      },
    });

    this.bucketName = env('R2_BUCKET_NAME');
    this.publicUrl = env('R2_PUBLIC_URL');
  }

  @Log({ logReturn: false })
  async generatePresignedUrlWithThumbnail(
    fileName: string,
    contentType: string,
    category: string,
    fileSize?: number,
  ): Promise<PresignedUrlWithThumbnailResult> {
    try {
      this.validateContentType(contentType, category);
      if (fileSize) this.validateFileSize(fileSize, category);

      // main image
      const fileExtension = this.extractFileExtension(fileName);
      const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
      const fileKey = `${category}/${uniqueFileName}`;
      const expiresIn = 10 * 60; // 10 分鐘

      const mainCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: contentType,
        Metadata: {
          'original-filename': encodeURIComponent(fileName),
          'upload-timestamp': new Date().toISOString(),
        },
        CacheControl: 'public, max-age=31536000, immutable',
      });

      const uploadUrl = await getSignedUrl(this.s3Client, mainCommand, {
        expiresIn,
      });
      const publicUrl = `${this.publicUrl}/${fileKey}`;

      const mainResult: PresignedUrlResult = {
        uploadUrl,
        fileKey,
        publicUrl,
        expiresIn,
      };

      // thumbnail（type fixed to `thumbnail`）
      const thumbFileName = `${crypto.randomUUID()}_thumbnail${fileExtension}`;
      const thumbKey = `${category}/thumbnail/${thumbFileName}`;

      const thumbCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: thumbKey,
        ContentType: contentType,
        Metadata: {
          'original-filename': encodeURIComponent(fileName),
          'upload-timestamp': new Date().toISOString(),
          thumbnail: 'true',
        },
        CacheControl: 'public, max-age=31536000, immutable',
      });

      const thumbnailUploadUrl = await getSignedUrl(
        this.s3Client,
        thumbCommand,
        { expiresIn },
      );
      const thumbnailPublicUrl = `${this.publicUrl}/${thumbKey}`;

      const thumbnailResult: PresignedUrlResult = {
        uploadUrl: thumbnailUploadUrl,
        fileKey: thumbKey,
        publicUrl: thumbnailPublicUrl,
        expiresIn,
      };

      return { main: mainResult, thumbnail: thumbnailResult };
    } catch (error) {
      throw this.handleS3Error(error);
    }
  }

  async verifyFileUploaded(fileKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);

      return true;
    } catch (error) {
      return false;
    }
  }

  async recordFile(
    fileKey: string,
    category: string,
    contentType: string,
    thumbnailKey: string,
    userId: string,
  ): Promise<RecordFileResult> {
    const fileUrl = this.publicUrl + '/' + fileKey;
    const thumbnailUrl = this.publicUrl + '/' + thumbnailKey;

    return await this.prisma.fileRecord.create({
      data: {
        fileKey,
        url: fileUrl,
        category,
        contentType,
        thumbnailKey,
        thumbnailUrl,
        userId,
      },
    });
  }

  async uploadJson(key: string, data: any): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    });

    await this.s3Client.send(command);
  }

  async downloadJson<T>(key: string): Promise<T> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const body = await response.Body?.transformToString();
    if (!body) throw new InternalError(`File not found with key: ${key}`);
    return JSON.parse(body);
  }

  async deleteFile(fileKey: string, thumbnailKey: string) {
    const keysToDelete = [fileKey, thumbnailKey].filter((key) => !!key);

    const deletionPromises = keysToDelete.map((key) => {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return this.s3Client.send(command);
    });

    try {
      await Promise.all(deletionPromises);

      await this.prisma.fileRecord.delete({
        where: { fileKey },
      });
    } catch (error) {
      throw this.handleS3Error(error);
    }
  }

  extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // 移除開頭的 '/'
    } catch (error) {
      throw new BadRequestError('INVALID_URL_FORMAT', 'Invalid URL format');
    }
  }

  private validateContentType(contentType: string, category: string) {
    if (this.ALLOWED_MIME_TYPES.includes(category)) {
      throw new BadRequestError(
        'INVALID_FILE_TYPE',
        `Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
  }

  private validateFileSize(fileSize: number, category: string) {
    const maxSize = this.MAX_FILE_SIZES[category] || 1 * 1024;

    if (fileSize > maxSize) {
      throw new BadRequestError(
        'FILE_TOO_LARGE',
        `File size exceeds limit. Maximum: ${maxSize / 1024 / 1024}MB`,
      );
    }
  }

  private extractFileExtension(fileName: string): string {
    const match = fileName.match(/\.[^.]+$/); // example.wtf.png -> .png
    return match ? match[0] : '';
  }

  private handleS3Error(
    error: unknown,
    context?: { fileKey?: string; command?: string },
  ): AppError {
    if (!(error instanceof S3ServiceException)) throw error;
    // Cast to S3 exception if possible
    const err = error as S3ServiceException;

    // Default values
    let code = 'STORAGE_ERROR';
    let message = 'An unexpected storage error occurred';
    let status = 500;

    if (err.name === 'NoSuchKey') {
      code = 'FILE_NOT_FOUND';
      message = context?.fileKey
        ? `File ${context.fileKey} does not exist`
        : 'File does not exist';
      status = 404;
    } else if (err.name === 'AccessDenied') {
      code = 'FORBIDDEN';
      message = context?.fileKey
        ? `No permission to access file ${context.fileKey}`
        : 'Access denied';
      status = 403;
    } else if (err.name === 'SlowDown' || err.name === 'ServiceUnavailable') {
      code = 'STORAGE_SERVICE_UNAVAILABLE';
      message = 'Storage service is temporarily unavailable, please try again';
      status = 503;
    } else {
      // fallback: unknown error
      code = 'STORAGE_ERROR';
      const operation = context?.command
        ? context.command
        : 'storage operation';
      message = context?.fileKey
        ? `Failed to perform ${operation} on file ${context.fileKey}`
        : `Failed to perform ${operation}`;
      status = 500;
    }

    return new AppError(code, message, status);
  }
}
