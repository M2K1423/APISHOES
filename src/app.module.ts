import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
 
import { UserSchema } from "./users/user.schema";
import { UsersService } from "./users/users.service";
import { UsersController } from "./users/users.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
        dbName: configService.get<string>("MONGODB_DB_NAME")
      })
    })
    ,
    MongooseModule.forFeature([{ name: "User", schema: UserSchema }])
  ],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService]
})
export class AppModule {}