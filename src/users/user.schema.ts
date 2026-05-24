import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  uid!: string;

  @Prop()
  email?: string;

  @Prop()
  displayName?: string;

  @Prop()
  photoURL?: string;

  @Prop()
  provider?: string;

  @Prop({ default: false })
  isAdmin?: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
