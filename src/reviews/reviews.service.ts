import { Injectable, BadRequestException, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Review } from "./review.schema";
import { Product } from "../products/product.schema";
import { Order } from "../orders/order.schema";
import { CreateReviewDto } from "./dto/create-review.dto";

@Injectable()
export class ReviewsService implements OnModuleInit {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>
  ) {}

  async onModuleInit() {
    void this.syncAllProductRatings();
  }

  async syncAllProductRatings(): Promise<void> {
    try {
      const products = await this.productModel.find().exec();
      for (const product of products) {
        await this.updateProductRating(product.id);
      }
    } catch (err) {
      console.error("Failed to sync product ratings on startup:", err);
    }
  }

  async createReview(userId: string, userName: string, dto: CreateReviewDto): Promise<Review> {
    // Check if the user has purchased the product
    const purchased = await this.orderModel.findOne({
      userId,
      status: { $in: ["delivered", "completed", "Đã giao"] },
      "items.productId": dto.productId
    }).exec();

    if (!purchased) {
      throw new BadRequestException("Bạn chỉ có thể nhận xét những sản phẩm đã được giao thành công.");
    }

    const product = await this.productModel.findOne({ id: dto.productId }).lean().exec();
    const productName = product ? product.name : dto.productId;
    const productImage = product && product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : "";

    const review = new this.reviewModel({
      productId: dto.productId,
      productName,
      productImage,
      userId,
      userName: userName || "Khách hàng",
      rating: dto.rating,
      comment: dto.comment,
      imageUrls: dto.imageUrls || [],
      isVerifiedPurchase: true,
      status: "approved" // default auto-approve
    });

    const saved = await review.save();
    await this.updateProductRating(dto.productId);
    return saved;
  }

  async updateProductRating(productId: string): Promise<void> {
    const reviews = await this.reviewModel.find({ productId, status: "approved" }).exec();
    if (reviews.length === 0) {
      await this.productModel.updateOne(
        { id: productId },
        { rating: 0, reviewCount: 0 }
      ).exec();
      return;
    }

    const totalStars = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round((totalStars / reviews.length) * 10) / 10;

    await this.productModel.updateOne(
      { id: productId },
      { rating: averageRating, reviewCount: reviews.length }
    ).exec();
  }

  async getReviewsByProduct(productId: string): Promise<Review[]> {
    return this.reviewModel.find({ productId, status: "approved" }).sort({ createdAt: -1 }).exec();
  }

  async getReviewsAdmin(): Promise<any[]> {
    const reviews = await this.reviewModel.find().sort({ createdAt: -1 }).exec();
    const result = [];
    for (const r of reviews) {
      const reviewObj = r.toObject() as any;
      if (!reviewObj.productName || !reviewObj.productImage) {
        const product = await this.productModel.findOne({ id: reviewObj.productId }).lean().exec();
        if (product) {
          reviewObj.productName = product.name;
          reviewObj.productImage = product.imageUrls?.[0] || "";
        }
      }
      result.push(reviewObj);
    }
    return result;
  }

  async updateReviewStatus(id: string, status: string): Promise<Review | null> {
    const review = await this.reviewModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).exec();

    if (review) {
      await this.updateProductRating(review.productId);
    }
    return review;
  }

  async addAdminReply(id: string, reply: string): Promise<Review | null> {
    return this.reviewModel.findByIdAndUpdate(
      id,
      {
        adminReply: reply,
        adminReplyAt: new Date()
      },
      { new: true }
    ).exec();
  }
}
