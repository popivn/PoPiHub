import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BoAuthGuard } from '../auth/bo-auth.guard';
import { UploadsService } from './uploads.service';

/**
 * Upload controller — POST /api/uploads/image (admin JWT required).
 * Nhận multipart/form-data field `file`, trả về public URL.
 */
@Controller('uploads')
@UseGuards(BoAuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Chỉ chấp nhận file ảnh'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Thiếu file upload');
    }
    const url = await this.uploads.uploadImage(file);
    return { url };
  }
}
