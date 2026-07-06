import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Order } from "./order.schema";
import { Product } from "../products/product.schema";
import { randomBytes } from "node:crypto";
import { RealtimeGateway } from "../realtime/realtime.gateway";

function parsePrice(price: string) {
  return Number(String(price).replace(/\D/g, "")) || 0;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  async createOrder(userId: string, orderData: any): Promise<Order> {
    const requestedItems = Array.isArray(orderData.items) ? orderData.items : [];
    const products = await this.productModel.find({ id: { $in: requestedItems.map((item: any) => item.productId) } }).lean().exec();
    const productMap = new Map(products.map((product) => [product.id, product]));
    const items = requestedItems.map((item: any) => {
      const product = productMap.get(item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} does not exist`);
      
      if ((product.stock ?? 0) < item.quantity) {
        throw new BadRequestException(`Sản phẩm ${product.name} chỉ còn ${product.stock ?? 0} sản phẩm trong kho.`);
      }

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
      paymentAccessToken: isVnpay ? randomBytes(24).toString("hex") : undefined,
      statusHistory: [
        {
          status: "pending",
          updatedAt: new Date(),
          updatedBy: userId.startsWith("guest-") ? "guest" : "user",
          note: "Đơn hàng được khởi tạo thành công"
        }
      ]
    });
    const savedOrder = await newOrder.save();

    try {
      const orderObj = savedOrder as any;
      this.realtimeGateway.emitOrderCreated({
        orderId: String(savedOrder._id),
        customerName: savedOrder.shippingAddress?.fullName || "Khách lẻ",
        total: savedOrder.total,
        message: "Có đơn đặt hàng mới!",
        createdAt: orderObj.createdAt ? orderObj.createdAt.toISOString() : new Date().toISOString()
      });
    } catch {
      // Ignore websocket errors
    }

    return savedOrder;
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

  async getAllOrdersPaginated(page: number, limit: number, search?: string, status?: string) {
    const filter: any = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      const normalizedSearch = search.trim();
      const orConditions: any[] = [
        { userId: { $regex: normalizedSearch, $options: "i" } }
      ];

      if (normalizedSearch.match(/^[0-9a-fA-F]{24}$/)) {
        orConditions.push({ _id: normalizedSearch });
      }

      orConditions.push(
        { "shippingAddress.fullName": { $regex: normalizedSearch, $options: "i" } },
        { "shippingAddress.phone": { $regex: normalizedSearch, $options: "i" } },
        { "shippingAddress.email": { $regex: normalizedSearch, $options: "i" } },
        { "shippingAddress.address": { $regex: normalizedSearch, $options: "i" } }
      );

      filter.$or = orConditions;
    }

    const skip = (page - 1) * limit;
    const [orders, totalCount] = await Promise.all([
      this.orderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.orderModel.countDocuments(filter).exec()
    ]);

    const allStatsData = await this.orderModel.find({}, "status total").exec();
    const totalOrders = allStatsData.length;
    const pendingOrders = allStatsData.filter((o) => (o.status ?? "pending") === "pending").length;
    const shippingOrders = allStatsData.filter((o) => ["processing", "shipped"].includes(o.status ?? "pending")).length;
    const deliveredOrders = allStatsData.filter((o) => (o.status ?? "pending") === "delivered").length;
    const revenue = allStatsData
      .filter((o) => (o.status ?? "pending") === "delivered")
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return {
      orders,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stats: {
        totalOrders,
        pendingOrders,
        shippingOrders,
        deliveredOrders,
        revenue
      }
    };
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | null> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) return null;

    const previousStatus = order.status || "pending";

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            updatedAt: new Date(),
            updatedBy: "admin",
            note: `Cập nhật trạng thái từ "${previousStatus}" sang "${status}"`
          }
        }
      },
      { returnDocument: "after" }
    ).exec();

    const wasDeducted = ["processing", "shipped", "delivered"].includes(previousStatus);
    const isDeducted = ["processing", "shipped", "delivered"].includes(status);

    if (!wasDeducted && isDeducted) {
      for (const item of order.items) {
        await this.productModel.updateOne(
          { id: item.productId },
          {
            $inc: {
              stock: -item.quantity,
              sold: item.quantity
            }
          }
        ).exec();
      }
    } else if (wasDeducted && !isDeducted) {
      for (const item of order.items) {
        await this.productModel.updateOne(
          { id: item.productId },
          {
            $inc: {
              stock: item.quantity,
              sold: -item.quantity
            }
          }
        ).exec();
      }
    }

    return updatedOrder;
  }
}
