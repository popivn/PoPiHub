import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getStorage } from '../app/firebase-admin';

@Injectable()
export class UploadsService {
  /**
   * Upload ảnh lên Firebase Cloud Storage.
   * Trả về public URL (token tự động được tạo).
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    const storage = getStorage();
    if (!storage) {
      throw new InternalServerErrorException('Firebase Storage chưa được cấu hình (FIREBASE_STORAGE_BUCKET)');
    }

    const bucket = storage.bucket();
    const ext = file.originalname.split('.').pop() || 'jpg';
    const filename = `features/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const fileRef = bucket.file(filename);

    try {
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          cacheControl: 'public, max-age=31536000',
        },
        public: true,
      });

      // Public URL format: https://storage.googleapis.com/<bucket>/<filename>
      return `https://storage.googleapis.com/${bucket.name}/${filename}`;
    } catch (err) {
      console.error('[UploadsService] Upload failed:', err);
      throw new InternalServerErrorException('Upload ảnh thất bại');
    }
  }
}
