import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Order } from "./order.schema";

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private readonly orderModel: Model<Order>) {}

  async createOrder(userId: string, orderData: any): Promise<Order> {
    const newOrder = new this.orderModel({
      userId,
      ...orderData
    });
    return newOrder.save();
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getOrderById(orderId: string, userId: string): Promise<Order | null> {
    return this.orderModel.findOne({ _id: orderId, userId }).exec();
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | null> {
    return this.orderModel.findByIdAndUpdate(
      orderId,
      { $set: { status } },
      { new: true }
    ).exec();
  }
}
