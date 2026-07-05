import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { FirebaseAuthGuard } from "../users/auth.guard";

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

@Controller("chat")
export class ChatController {
  @Post("upload")
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async uploadImage(@UploadedFile() file?: UploadedImage) {
    if (!file) throw new BadRequestException("Image file is required");
    const safeExtension = IMAGE_TYPES[file.mimetype];
    if (!safeExtension) throw new BadRequestException("Only JPG, PNG, WEBP and GIF images are supported");

    const uploadDirectory = join(process.cwd(), "uploads", "chat");
    await mkdir(uploadDirectory, { recursive: true });
    const originalExtension = extname(file.originalname).toLowerCase();
    const extension = Object.values(IMAGE_TYPES).includes(originalExtension) ? originalExtension : safeExtension;
    const filename = `${randomUUID()}${extension}`;
    await writeFile(join(uploadDirectory, filename), file.buffer);
    return { imageUrl: `/uploads/chat/${filename}` };
  }
}
