import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DEFAULT_PRODUCTS } from "./product.constants";
import { Product } from "./product.schema";

@Injectable()
export class ProductsService implements OnModuleInit {
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
}
