import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { unlink } from "node:fs/promises";
import { basename, join } from "node:path";
import { User } from "../users/user.schema";
import { ChatConversation } from "./chat-conversation.schema";
import { ChatMessage, ChatSenderRole } from "./chat-message.schema";

export type ChatActor = {
  uid: string;
  role: ChatSenderRole;
  displayName?: string;
  email?: string;
  photoURL?: string;
};

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatConversation.name) private readonly conversationModel: Model<ChatConversation>,
    @InjectModel(ChatMessage.name) private readonly messageModel: Model<ChatMessage>
  ) {}

  private serializeConversation(conversation: ChatConversation | Record<string, any>) {
    const value: any = typeof (conversation as any).toObject === "function"
      ? (conversation as any).toObject()
      : conversation;
    return {
      id: String(value._id), customerId: value.customerId,
      customerName: value.customerName, customerEmail: value.customerEmail,
      customerPhotoURL: value.customerPhotoURL ?? null,
      lastMessage: value.lastMessage ?? "",
      lastMessageAt: value.lastMessageAt?.toISOString?.() ?? value.lastMessageAt,
      unreadForAdmin: value.unreadForAdmin ?? 0,
      unreadForCustomer: value.unreadForCustomer ?? 0,
      createdAt: value.createdAt?.toISOString?.() ?? value.createdAt,
      updatedAt: value.updatedAt?.toISOString?.() ?? value.updatedAt
    };
  }

  private serializeMessage(message: ChatMessage | Record<string, any>) {
    const value: any = typeof (message as any).toObject === "function"
      ? (message as any).toObject()
      : message;
    return {
      id: String(value._id), conversationId: String(value.conversationId),
      senderId: value.senderId, senderRole: value.senderRole,
      senderName: value.senderName, content: value.content,
      imageUrl: value.imageUrl ?? null,
      readAt: value.readAt?.toISOString?.() ?? value.readAt ?? null,
      createdAt: value.createdAt?.toISOString?.() ?? value.createdAt,
      updatedAt: value.updatedAt?.toISOString?.() ?? value.updatedAt
    };
  }

  async getOrCreateCustomerConversation(actor: ChatActor) {
    const conversation = await this.conversationModel.findOneAndUpdate(
      { customerId: actor.uid },
      {
        $set: {
          customerName: actor.displayName || actor.email || "Khách hàng",
          customerEmail: actor.email || "",
          customerPhotoURL: actor.photoURL || null
        },
        $setOnInsert: { lastMessageAt: new Date() }
      },
      { upsert: true, returnDocument: "after" }
    ).exec();
    return this.serializeConversation(conversation);
  }

  async listConversations() {
    const values = await this.conversationModel.find().sort({ lastMessageAt: -1 }).limit(200).exec();
    return values.map((value) => this.serializeConversation(value));
  }

  async getConversationForActor(conversationId: string, actor: ChatActor) {
    if (!Types.ObjectId.isValid(conversationId)) throw new BadRequestException("Conversation ID is invalid");
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (actor.role !== "admin" && conversation.customerId !== actor.uid) {
      throw new ForbiddenException("You cannot access this conversation");
    }
    return conversation;
  }

  async getHistory(conversationId: string, actor: ChatActor, limit = 100) {
    await this.getConversationForActor(conversationId, actor);
    const messages = await this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 }).limit(Math.min(Math.max(limit, 1), 200)).exec();
    return messages.reverse().map((message) => this.serializeMessage(message));
  }

  async sendMessage(
    actor: ChatActor,
    conversationId: string | undefined,
    rawContent: unknown,
    rawImageUrl?: unknown
  ) {
    const content = typeof rawContent === "string" ? rawContent.trim() : "";
    const imageUrl = typeof rawImageUrl === "string" ? rawImageUrl.trim() : "";
    if (!content && !imageUrl) throw new BadRequestException("Message cannot be empty");
    if (content.length > 2000) throw new BadRequestException("Message cannot exceed 2000 characters");
    if (imageUrl && (!imageUrl.startsWith("/uploads/chat/") || imageUrl.length > 500)) {
      throw new BadRequestException("Chat image URL is invalid");
    }

    let targetId = conversationId;
    if (actor.role === "customer") targetId = (await this.getOrCreateCustomerConversation(actor)).id;
    if (!targetId) throw new BadRequestException("Conversation ID is required");

    const conversation = await this.getConversationForActor(targetId, actor);
    const message = await this.messageModel.create({
      conversationId: conversation._id, senderId: actor.uid, senderRole: actor.role,
      senderName: actor.displayName || actor.email || (actor.role === "admin" ? "Nhân viên hỗ trợ" : "Khách hàng"),
      content,
      imageUrl: imageUrl || null
    });
    const unreadField = actor.role === "admin" ? "unreadForCustomer" : "unreadForAdmin";
    const updated = await this.conversationModel.findByIdAndUpdate(
      conversation._id,
      { $set: { lastMessage: content || "Đã gửi một ảnh", lastMessageAt: message.createdAt }, $inc: { [unreadField]: 1 } },
      { returnDocument: "after" }
    ).exec();
    return { message: this.serializeMessage(message), conversation: this.serializeConversation(updated!) };
  }

  async markRead(conversationId: string, actor: ChatActor) {
    const conversation = await this.getConversationForActor(conversationId, actor);
    const otherRole: ChatSenderRole = actor.role === "admin" ? "customer" : "admin";
    await this.messageModel.updateMany(
      { conversationId: conversation._id, senderRole: otherRole, readAt: null },
      { $set: { readAt: new Date() } }
    ).exec();
    const unreadField = actor.role === "admin" ? "unreadForAdmin" : "unreadForCustomer";
    const updated = await this.conversationModel.findByIdAndUpdate(
      conversation._id, { $set: { [unreadField]: 0 } }, { returnDocument: "after" }
    ).exec();
    return this.serializeConversation(updated!);
  }

  async endConversation(conversationId: string, actor: ChatActor) {
    const conversation = await this.getConversationForActor(conversationId, actor);
    const imageMessages = await this.messageModel
      .find({ conversationId: conversation._id, imageUrl: { $ne: null } })
      .select({ imageUrl: 1, _id: 0 })
      .lean()
      .exec();
    await this.messageModel.deleteMany({ conversationId: conversation._id }).exec();
    await this.conversationModel.deleteOne({ _id: conversation._id }).exec();
    await Promise.allSettled(imageMessages.map((message) => {
      const filename = basename(String(message.imageUrl || ""));
      return filename ? unlink(join(process.cwd(), "uploads", "chat", filename)) : Promise.resolve();
    }));
    return {
      conversationId: String(conversation._id),
      endedBy: actor.role
    };
  }

  actorFromUser(user: User, decoded: Record<string, any>): ChatActor {
    return {
      uid: decoded.uid, role: user.isAdmin ? "admin" : "customer",
      displayName: user.displayName || decoded.name, email: user.email || decoded.email,
      photoURL: user.photoURL || decoded.picture
    };
  }
}
