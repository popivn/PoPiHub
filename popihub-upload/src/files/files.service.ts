import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export interface FileInfo {
  name: string;
  size: number;
  uploadedAt: Date;
}

@Injectable()
export class FilesService implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.ensureUploadDir();
  }

  async ensureUploadDir(): Promise<void> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }

  async listFiles(): Promise<FileInfo[]> {
    await this.ensureUploadDir();
    const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });
    const files: FileInfo[] = [];
    for (const entry of entries) {
      if (entry.isFile()) {
        const stat = await fs.stat(path.join(UPLOAD_DIR, entry.name));
        files.push({
          name: entry.name,
          size: stat.size,
          uploadedAt: stat.mtime,
        });
      }
    }
    files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    return files;
  }

  getFilePath(filename: string): string {
    return path.join(UPLOAD_DIR, path.basename(filename));
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = this.getFilePath(filename);
    await fs.unlink(filePath);
  }
}
