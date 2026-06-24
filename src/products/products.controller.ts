import { Controller, Get, Post, Put, Delete, Body, NotFoundException, Param, Query, UseGuards } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { FirebaseAuthGuard } from "../users/auth.guard";
import { RolesGuard } from "../users/roles.guard";
import { Roles } from "../users/roles.decorator";
import { CreateProductDto, UpdateProductDto } from "./dto/create-product.dto";

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
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  async createProduct(@Body() body: CreateProductDto) {
    return this.productsService.createProduct(body);
  }

  @Put(":id")
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  async updateProduct(@Param("id") id: string, @Body() body: UpdateProductDto) {
    const updated = await this.productsService.updateProduct(id, body);
    if (!updated) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return updated;
  }

  @Delete(":id")
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles("admin")
  async deleteProduct(@Param("id") id: string) {
    const deleted = await this.productsService.deleteProduct(id);
    if (!deleted) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return { success: true };
  }
}
