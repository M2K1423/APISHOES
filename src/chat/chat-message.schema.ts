import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ChatSenderRole = "customer" | "admin";

@Schema({ timestamps: true })
export class ChatMessage extends Document {
  @Prop({ type: Types.ObjectId, ref: "ChatConversation", required: true, index: true })
  conversationId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  senderId!: string;

  @Prop({ required: true, enum: ["customer", "admin"] })
  senderRole!: ChatSenderRole;

  @Prop({ default: "" })
  senderName!: string;

  @Prop({ default: "", maxlength: 2000 })
  content!: string;

  @Prop({ type: String, default: null, maxlength: 500 })
  imageUrl!: string | null;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });
