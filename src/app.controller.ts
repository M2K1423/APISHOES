import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  healthCheck() {
    return this.appService.getHealth();
  }

  @Get("products")
  getProducts() {
    return this.appService.getProducts();
  }

  @Get("products/:id")
  async getProductById(@Param("id") id: string) {
    const product = await this.appService.getProductById(id);

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }
}