import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Product, ProductSchema } from "./products/product.schema";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
        dbName: configService.get<string>("MONGODB_DB_NAME")
      })
    }),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}