import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Product } from "../products/product.schema";
import { RealtimeGateway, ProductCreatedNotification } from "../realtime/realtime.gateway";
import { Notification } from "./notification.schema";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  private toProductCreatedPayload(notification: Notification): ProductCreatedNotification {
    return {
      id: notification.productId,
      name: notification.productName,
      brand: notification.productBrand,
      price: notification.productPrice,
      imageUrl: notification.productImageUrl,
      message: notification.message,
      createdAt: notification.createdAt.toISOString()
    };
  }

  async createProductCreatedNotification(product: Product): Promise<ProductCreatedNotification> {
    const created = await this.notificationModel.create({
      type: "product_created",
      productId: product.id,
      productName: product.name,
      productBrand: product.brand,
      productPrice: product.price,
      productImageUrl: product.imageUrls?.[0] ?? null,
      message: "New product available"
    });

    const payload = this.toProductCreatedPayload(created);
    this.realtimeGateway.emitProductCreated(payload);
    return payload;
  }

  async getRecentNotifications(limit = 10): Promise<ProductCreatedNotification[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 30);
    const notifications = await this.notificationModel
      .find({ type: "product_created" })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();

    return notifications.map((notification) => ({
      id: notification.productId,
      name: notification.productName,
      brand: notification.productBrand,
      price: notification.productPrice,
      imageUrl: notification.productImageUrl,
      message: notification.message,
      createdAt: notification.createdAt.toISOString()
    }));
  }
}
