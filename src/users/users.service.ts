import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import { User } from "./user.schema";

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
}
