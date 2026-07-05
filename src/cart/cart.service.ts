import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cart } from "./cart.schema";

@Injectable()
export class CartService {
  constructor(@InjectModel(Cart.name) private readonly cartModel: Model<Cart>) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartModel.findOne({ userId });
    
    if (!cart) {
      cart = await this.cartModel.create({ userId, items: [] });
    }
    
    return cart;
  }

  async updateCart(userId: string, items: any[]): Promise<Cart> {
    return this.cartModel.findOneAndUpdate(
      { userId },
      { $set: { items } },
      { returnDocument: "after", upsert: true }
    );
  }

  async clearCart(userId: string): Promise<Cart> {
    return this.cartModel.findOneAndUpdate(
      { userId },
      { $set: { items: [] } },
      { returnDocument: "after", upsert: true }
    );
  }
}
