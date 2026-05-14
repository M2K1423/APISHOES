import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix("api");

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`API shoes listening on http://localhost:${port}/api`);
}

bootstrap();