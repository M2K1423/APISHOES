import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "node:path";
import { json, urlencoded } from "express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Use Helmet for security HTTP headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads/" });
  
  // Increase payload size limit for Base64 image uploads
  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ extended: true, limit: "10mb" }));
  
  // Configure CORS
  app.enableCors({
    origin: true, // Allow request origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });
  
  app.setGlobalPrefix("api");
  
  // Enable global ValidationPipe with security configurations
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-decorated properties
      forbidNonWhitelisted: true, // Throw error on non-decorated properties
      transform: true, // Auto-transform payloads to match DTO classes
    })
  );

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`API shoes listening on http://localhost:${port}/api`);
}

bootstrap();
