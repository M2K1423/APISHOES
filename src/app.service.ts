import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DEFAULT_PRODUCTS } from "./products/product.constants";
import { Product } from "./products/product.schema";

@Injectable()
export class AppService implements OnModuleInit {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<Product>) {}

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

  getHealth() {
    return {
      status: "ok",
      service: "api-shoes",
      message: "Shoes API is running"
    };
  }

  async getProducts(): Promise<Product[]> {
    const products = await this.productModel.find().sort({ id: 1 }).lean();

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
}