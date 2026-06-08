import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Use Helmet for security HTTP headers
  app.use(helmet());
  
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