import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppService } from "./app.service";

async function seedProducts() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"]
  });

  try {
    const appService = app.get(AppService);
    await appService.seedProducts(true);
    console.log("Products collection seeded successfully.");
  } finally {
    await app.close();
  }
}

seedProducts();