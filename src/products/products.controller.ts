import { Controller, Get, Post, Put, Delete, Body, NotFoundException, Param, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getProducts(
    @Query("brand") brand?: string,
    @Query("category") category?: string,
    @Query("search") search?: string
  ) {
    return this.productsService.getProducts({ brand, category, search });
  }

  @Get(":id")
  async getProductById(@Param("id") id: string) {
    const product = await this.productsService.getProductById(id);

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }

  @Post()
  async createProduct(@Body() body: any) {
    return this.productsService.createProduct(body);
  }

  @Put(":id")
  async updateProduct(@Param("id") id: string, @Body() body: any) {
    const updated = await this.productsService.updateProduct(id, body);
    if (!updated) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return updated;
  }

  @Delete(":id")
  async deleteProduct(@Param("id") id: string) {
    const deleted = await this.productsService.deleteProduct(id);
    if (!deleted) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return { success: true };
  }
}
