import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserDocument } from "./user.schema";

@Injectable()
export class UsersService {
  constructor(@InjectModel("User") private userModel: Model<UserDocument>) {}

  async upsertUser(payload: Partial<UserDocument>) {
    if (!payload.uid) return null;

    const now = new Date();
    try {
      return await this.userModel
        .findOneAndUpdate(
          { uid: payload.uid },
          { $set: { ...payload, lastLogin: now }, $setOnInsert: { createdAt: now } },
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
}
