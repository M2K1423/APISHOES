import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class ChatConversation extends Document {
  @Prop({ required: true, unique: true, index: true })
  customerId!: string;

  @Prop({ default: "Khách hàng" })
  customerName!: string;

  @Prop({ default: "" })
  customerEmail!: string;

  @Prop({ type: String, default: null })
  customerPhotoURL!: string | null;

  @Prop({ default: "" })
  lastMessage!: string;

  @Prop({ type: Date, default: Date.now, index: true })
  lastMessageAt!: Date;

  @Prop({ default: 0 })
  unreadForAdmin!: number;

  @Prop({ default: 0 })
  unreadForCustomer!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ChatConversationSchema = SchemaFactory.createForClass(ChatConversation);
