import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ProductsService } from "./products/products.service";

async function seedProducts() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"]
  });

  try {
    const productsService = app.get(ProductsService);
    await productsService.seedProducts(true);
    console.log("Products collection seeded successfully.");
  } finally {
    await app.close();
  }
}

seedProducts();