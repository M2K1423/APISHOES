import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import { User } from "./user.schema";
import { firebaseAdmin } from "../firebase-admin.config";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService
  ) {}

  async upsertUser(payload: Partial<User>) {
    if (!payload.uid) return null;

    const now = new Date();
    
    const safeData: any = {
      uid: payload.uid,
      email: payload.email,
      displayName: payload.displayName,
      photoURL: payload.photoURL,
      provider: payload.provider,
      lastLogin: now
    };



    try {
      return await this.userModel
        .findOneAndUpdate(
          { uid: payload.uid },
          { $set: { ...safeData }, $setOnInsert: { createdAt: now } },
          { upsert: true, returnDocument: "after" }
        )
        .exec();
    } catch (err) {
      // Log error to help debug (authentication/connection issues)
      // In production, replace with structured logger
      // eslint-disable-next-line no-console
      console.error("UsersService.upsertUser error:", err);
      return null;
    }
  }

  async getAllUsers() {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async getUserByUid(uid: string) {
    return this.userModel.findOne({ uid }).exec();
  }

  async changeUserPassword(uid: string, newPassword: string): Promise<void> {
    try {
      await firebaseAdmin.auth().updateUser(uid, {
        password: newPassword,
      });
    } catch (error: any) {
      throw new Error(`Không thể đổi mật khẩu Firebase: ${error.message}`);
    }
  }

  async updateUserRole(uid: string, isAdmin: boolean): Promise<User | null> {
    const updated = await this.userModel.findOneAndUpdate(
      { uid },
      { isAdmin },
      { new: true }
    ).exec();

    if (!updated) {
      throw new NotFoundException(`Không tìm thấy người dùng với UID ${uid}`);
    }
    return updated;
  }

  async deleteUser(uid: string): Promise<any> {
    // 1. Xóa khỏi Firebase Auth
    try {
      await firebaseAdmin.auth().deleteUser(uid);
    } catch (error: any) {
      console.warn(`Không tìm thấy user trên Firebase Auth khi xóa: ${error.message}`);
    }

    // 2. Xóa khỏi MongoDB
    const result = await this.userModel.deleteOne({ uid }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Không tìm thấy người dùng với UID ${uid} trong MongoDB`);
    }
    return { success: true };
  }
}
