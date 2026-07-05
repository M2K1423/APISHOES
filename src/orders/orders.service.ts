import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Order } from "./order.schema";
import { Product } from "../products/product.schema";
import { randomBytes } from "node:crypto";

function parsePrice(price: string) {
  return Number(String(price).replace(/\D/g, "")) || 0;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>
  ) {}

  async createOrder(userId: string, orderData: any): Promise<Order> {
    const requestedItems = Array.isArray(orderData.items) ? orderData.items : [];
    const products = await this.productModel.find({ id: { $in: requestedItems.map((item: any) => item.productId) } }).lean().exec();
    const productMap = new Map(products.map((product) => [product.id, product]));
    const items = requestedItems.map((item: any) => {
      const product = productMap.get(item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} does not exist`);
      return {
        productId: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        oldPrice: product.oldPrice || "",
        image: product.imageUrls?.[0] || null,
        size: item.size,
        color: item.color || "",
        quantity: item.quantity
      };
    });
    const total = items.reduce((sum: number, item: any) => sum + parsePrice(item.price) * item.quantity, 0);
    if (total <= 0) throw new BadRequestException("Order total must be greater than zero");
    const isVnpay = orderData.paymentMethod === "vnpay";
    const newOrder = new this.orderModel({
      userId,
      ...orderData,
      items,
      total,
      paymentStatus: isVnpay ? "pending" : "unpaid",
      paymentAccessToken: isVnpay ? randomBytes(24).toString("hex") : undefined
    });
    return newOrder.save();
  }

  getOrderForPayment(orderId: string, accessToken: string) {
    return this.orderModel.findOne({ _id: orderId, paymentAccessToken: accessToken }).select("+paymentAccessToken").exec();
  }

  getOrderForPaymentCallback(orderId: string) {
    return this.orderModel.findById(orderId).exec();
  }

  updatePaymentResult(orderId: string, data: Partial<Order>) {
    return this.orderModel.findByIdAndUpdate(orderId, { $set: data }, { returnDocument: "after" }).exec();
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
      { returnDocument: "after" }
    ).exec();
  }
}
