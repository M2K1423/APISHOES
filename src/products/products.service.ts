import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DEFAULT_PRODUCTS } from "./product.constants";
import { Product } from "./product.schema";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly notificationsService: NotificationsService
  ) { }

  private normalizeString(value: unknown, fallback = "") {
    if (typeof value === "string") {
      return value.trim();
    }

    if (value === undefined || value === null) {
      return fallback;
    }

    return String(value).trim();
  }

  private normalizeList(value: unknown, fallback: string[] = []) {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeString(item)).filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return fallback;
  }

  private normalizeNumber(value: unknown, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
  }

  private normalizeProductPayload(productData: any, existing?: Product) {
    const imageUrls = this.normalizeList(
      productData.imageUrls ?? productData.images ?? productData.image,
      existing?.imageUrls ?? []
    );

    const colors = this.normalizeList(productData.colors, existing?.colors ?? []);

    return {
      id: this.normalizeString(productData.id, existing?.id ?? ""),
      name: this.normalizeString(productData.name, existing?.name ?? ""),
      brand: this.normalizeString(productData.brand, existing?.brand ?? ""),
      productType: this.normalizeString(productData.productType, existing?.productType ?? "New Arrival"),
      description: this.normalizeString(productData.description, existing?.description ?? ""),
      price: this.normalizeString(productData.price, existing?.price ?? ""),
      category: this.normalizeString(productData.category, existing?.category ?? ""),
      imageUrls,
      oldPrice: this.normalizeString(productData.oldPrice, existing?.oldPrice ?? ""),
      discount: this.normalizeString(productData.discount, existing?.discount ?? ""),
      promotion: this.normalizeString(productData.promotion, existing?.promotion ?? ""),
      rating: this.normalizeNumber(productData.rating, existing?.rating ?? 0),
      reviewCount: this.normalizeNumber(productData.reviewCount, existing?.reviewCount ?? 0),
      sold: this.normalizeNumber(productData.sold, existing?.sold ?? 0),
      colors
    };
  }

  async onModuleInit() {
    await this.seedProducts();
  }

  async seedProducts(force = false) {
    await this.productModel.createCollection();

    if (force) {
      await this.productModel.deleteMany({});
      await this.productModel.insertMany(DEFAULT_PRODUCTS);
      return;
    }

    const productCount = await this.productModel.countDocuments();

    if (productCount === 0) {
      await this.productModel.insertMany(DEFAULT_PRODUCTS);
    }
  }

  async getProducts(query: any = {}): Promise<Product[]> {
    const filter: any = {};

    if (query.brand) {
      filter.brand = new RegExp(`^${query.brand}$`, 'i');
    }

    if (query.category) {
      filter.category = new RegExp(`^${query.category}$`, 'i');
    }

    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { brand: new RegExp(query.search, 'i') },
        { category: new RegExp(query.search, 'i') }
      ];
    }

    const products = await this.productModel.find(filter).sort({ id: 1 }).lean();
    return products.map(({ _id, __v, ...product }) => product as Product);
  }

  async getProductById(id: string): Promise<Product | null> {
    const product = await this.productModel.findOne({ id }).lean();

    if (!product) {
      return null;
    }

    const { _id, __v, ...productData } = product;
    return productData as Product;
  }

  async createProduct(productData: any): Promise<Product> {
    const normalized = this.normalizeProductPayload(productData);

    if (!normalized.id) {
      normalized.id = normalized.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    }

    const newProduct = new this.productModel(normalized);
    const saved = await newProduct.save();
    const { _id, __v, ...data } = saved.toObject();
    const product = data as Product;
    await this.notificationsService.createProductCreatedNotification(product);
    return product;
  }

  async updateProduct(id: string, productData: any): Promise<Product | null> {
    const existing = await this.productModel.findOne({ id }).lean();

    if (!existing) {
      return null;
    }

    const normalized = this.normalizeProductPayload(productData, existing as Product);
    const updated = await this.productModel
      .findOneAndUpdate({ id }, { $set: normalized }, { returnDocument: "after" })
      .lean();

    if (!updated) return null;
    const { _id, __v, ...data } = updated;
    return data as Product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.productModel.deleteOne({ id });
    return result.deletedCount === 1;
  }
}
