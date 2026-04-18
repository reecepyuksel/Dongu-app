import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UploadApiResponse,
  UploadApiErrorResponse,
  v2 as cloudinary,
} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private configured = false;
  private configChecked = false;

  constructor(private readonly configService: ConfigService) {}

  private ensureConfigured(): boolean {
    if (this.configChecked) return this.configured;

    const nodeEnv =
      this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV;

    const cloudinaryUrl =
      this.configService.get<string>('CLOUDINARY_URL') ||
      process.env.CLOUDINARY_URL;

    const cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
      process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY') ||
      process.env.CLOUDINARY_API_KEY;
    const apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      process.env.CLOUDINARY_API_SECRET;

    let resolvedCloudName = cloudName;
    let resolvedApiKey = apiKey;
    let resolvedApiSecret = apiSecret;

    if (
      (!resolvedCloudName || !resolvedApiKey || !resolvedApiSecret) &&
      cloudinaryUrl
    ) {
      try {
        const parsed = new URL(cloudinaryUrl);
        resolvedCloudName = resolvedCloudName || parsed.hostname;
        resolvedApiKey = resolvedApiKey || decodeURIComponent(parsed.username);
        resolvedApiSecret =
          resolvedApiSecret || decodeURIComponent(parsed.password);
      } catch {
        // URL parse edilemezse aşağıdaki validasyon net hata döndürecek.
      }
    }

    if (!resolvedCloudName || !resolvedApiKey || !resolvedApiSecret) {
      this.configChecked = true;
      this.configured = false;

      throw new Error(
        `Cloudinary yapılandırması eksik. Upload işlemleri için CLOUDINARY_URL veya CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET zorunludur. (NODE_ENV=${nodeEnv})`,
      );
    }

    cloudinary.config({
      cloud_name: resolvedCloudName,
      api_key: resolvedApiKey,
      api_secret: resolvedApiSecret,
    });

    this.configured = true;
    this.configChecked = true;
    return true;
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    this.ensureConfigured();

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'loopp-items', resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(upload);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    this.ensureConfigured();

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
