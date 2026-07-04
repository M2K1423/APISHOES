import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { Types } from "mongoose";

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const validObjectId = Types.ObjectId.isValid(value);
    if (!validObjectId) {
      throw new BadRequestException("Invalid ID format. Must be a 24-character hexadecimal string.");
    }
    return value;
  }
}
