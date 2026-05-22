import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
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
}
