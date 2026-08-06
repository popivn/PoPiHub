import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { promises as fs } from 'fs';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async index(@Res() res: Response) {
    const files = await this.filesService.listFiles();
    const formattedFiles = files.map((f) => ({
      name: f.name,
      size: this.formatSize(f.size),
      uploadedAt: f.uploadedAt.toLocaleString('vi-VN'),
    }));
    res.render('index', { files: formattedFiles });
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 1024 * 1024 * 500 },
    }),
  )
  async upload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return {
      message: `Uploaded ${files.length} file(s) successfully`,
      files: files.map((f) => ({ name: f.filename, originalName: f.originalname, size: f.size })),
    };
  }

  @Get('download/:filename')
  async download(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.filesService.getFilePath(filename);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('File not found');
    }
    res.download(filePath, filename);
  }

  @Delete('files/:filename')
  async deleteFile(@Param('filename') filename: string) {
    await this.filesService.deleteFile(filename);
    return { message: 'File deleted' };
  }
}
