import { Injectable } from "@nestjs/common";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  colors: string[];
};

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: "ok",
      service: "api-shoes",
      message: "Shoes API is running"
    };
  }

  getProducts(): Product[] {
    return [
      {
        id: "runner-01",
        name: "Velocity Runner",
        description: "Giay chay bo nhe, dem am va phan hoi tot cho tap luyen hang ngay.",
        price: "1.890.000đ",
        category: "Running",
        colors: ["White", "Grey"]
      },
      {
        id: "street-02",
        name: "Urban Street",
        description: "Phom dep, de bang va de phoi voi ao thun, jeans hoac outfit toi gian.",
        price: "1.450.000đ",
        category: "Lifestyle",
        colors: ["Black", "Cream"]
      },
      {
        id: "court-03",
        name: "Court Classic",
        description: "Mau giay the thao co dien, de ben va ton dang trong moi bo trang phuc.",
        price: "1.620.000đ",
        category: "Court",
        colors: ["Navy", "White"]
      }
    ];
  }
}