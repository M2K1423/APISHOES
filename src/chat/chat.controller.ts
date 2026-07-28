import { BadRequestException, Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { FirebaseAuthGuard } from "../users/auth.guard";
import { ProductsService } from "../products/products.service";

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

@Controller("chat")
export class ChatController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly configService: ConfigService
  ) {}

  @Post("upload")
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async uploadImage(@UploadedFile() file?: UploadedImage) {
    if (!file) throw new BadRequestException("Image file is required");
    const safeExtension = IMAGE_TYPES[file.mimetype];
    if (!safeExtension) throw new BadRequestException("Only JPG, PNG, WEBP and GIF images are supported");

    const uploadDirectory = join(process.cwd(), "uploads", "chat");
    await mkdir(uploadDirectory, { recursive: true });
    const originalExtension = extname(file.originalname).toLowerCase();
    const extension = Object.values(IMAGE_TYPES).includes(originalExtension) ? originalExtension : safeExtension;
    const filename = `${randomUUID()}${extension}`;
    await writeFile(join(uploadDirectory, filename), file.buffer);
    return { imageUrl: `/uploads/chat/${filename}` };
  }

  @Post("ai-consult")
  @UseGuards(FirebaseAuthGuard)
  async aiConsult(
    @Body() body: {
      message: string;
      image?: { base64: string; mimeType: string };
      history?: { role: "user" | "model"; content: string }[];
    }
  ) {
    const userMessage = body.message?.trim();
    if (!userMessage) {
      throw new BadRequestException("Message is required");
    }

    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!apiKey) {
      return {
        reply: "Xin lỗi, hiện tại trợ lý AI chưa được cấu hình khóa API (GEMINI_API_KEY). Vui lòng thêm `GEMINI_API_KEY` vào file `.env` ở backend để kích hoạt."
      };
    }

    try {
      const products = await this.productsService.getProducts();
      const productsContext = products
        .map((p) => {
          const discountStr = p.discount ? ` (Giảm giá: ${p.discount})` : "";
          const oldPriceStr = p.oldPrice ? ` (Giá cũ: ${p.oldPrice} VND)` : "";
          const colorsStr = p.colors && p.colors.length ? `Màu sắc: ${p.colors.join(", ")}` : "";
          return `- **${p.name}** (${p.brand})
  Mã SP: ${p.id}
  Phân loại: ${p.category}
  Giá bán: ${p.price} VND${oldPriceStr}${discountStr}
  ${colorsStr}
  Đánh giá: ${p.rating}/5 (${p.reviewCount} lượt đánh giá)
  Mô tả: ${p.description}
  Đường dẫn: /products/${p.id}`;
        })
        .join("\n\n");

      const systemPrompt = `Bạn là Trợ lý AI tư vấn mua sắm giày thông minh, thân thiện của cửa hàng "Myshoes".
Nhiệm vụ của bạn là tư vấn cho khách hàng tìm kiếm giày, chọn size, màu sắc, thương hiệu và giải đáp thắc mắc về sản phẩm.

Dưới đây là danh sách sản phẩm giày hiện có trong cửa hàng:
${productsContext}

Quy tắc trả lời:
1. Bạn CHỈ được phép tư vấn và gợi ý các sản phẩm có tên trong danh sách trên. Không tự bịa ra sản phẩm khác.
2. Khi giới thiệu bất kỳ sản phẩm nào, luôn đính kèm đường dẫn của nó dưới dạng markdown link đúng định dạng: [Tên giày](/products/mã-sp) (ví dụ: [Nike Air Max 90](/products/nike-air-max-90)).
3. Hãy trả lời bằng tiếng Việt lịch sự, nhiệt tình, sử dụng icon phù hợp. Trình bày nội dung ngắn gọn, dễ đọc bằng cách dùng các gạch đầu dòng và định dạng in đậm.
4. Nếu khách hàng hỏi về đơn hàng, hãy hướng dẫn họ chọn chức năng "Kiểm tra đơn hàng" ở menu chat chính hoặc nhập mã đơn hàng của họ. Nếu họ muốn gặp nhân viên thật, hãy hướng dẫn họ tắt chế độ AI (click lại nút lấp lánh hoặc nút headset).
5. Bạn CHỈ được phép trả lời các câu hỏi liên quan đến sản phẩm giày, thương hiệu giày, size/màu sắc giày, việc mua sắm giày tại Myshoes, chính sách cửa hàng, đơn hàng hoặc các vấn đề trực tiếp liên quan đến giày dép và dịch vụ của cửa hàng.
Nếu khách hàng hỏi bất kỳ câu hỏi nào ngoài phạm vi này (ví dụ: tư vấn xổ số kiến thiết, nấu ăn, thời tiết, giải toán, viết mã, lập trình, tin tức chính trị, v.v.), bạn tuyệt đối KHÔNG được trả lời câu hỏi đó, mà phải trả lời chính xác theo mẫu dưới đây (thay thế [chủ đề không liên quan] bằng chủ đề mà khách hàng đã hỏi, ví dụ "xổ số kiến thiết", "nấu ăn", v.v. một cách phù hợp và tự nhiên):

Dạ, Myshoes rất tiếc là tụi mình không có thông tin tư vấn về [chủ đề không liên quan] rồi ạ. 😅 Nhiệm vụ chính của mình là hỗ trợ bạn tìm kiếm và chọn lựa những đôi giày thật êm ái, thời trang và có giá ưu đãi nhất tại cửa hàng thôi nè!

Bạn có muốn mình tư vấn thêm về size hay kiểu dáng của mẫu giày nào khác không ạ? 😉

Chú ý: Giữ đúng định dạng và các icon 😅, 😉 của mẫu trả lời trên.`;

      const contents: any[] = [];
      if (body.history && Array.isArray(body.history)) {
        for (const msg of body.history) {
          contents.push({
            role: msg.role === "model" ? "model" : "user",
            parts: [{ text: msg.content }]
          });
        }
      }

      const userParts: any[] = [{ text: userMessage }];
      if (body.image && body.image.base64 && body.image.mimeType) {
        userParts.push({
          inlineData: {
            mimeType: body.image.mimeType,
            data: body.image.base64
          }
        });
      }

      contents.push({
        role: "user",
        parts: userParts
      });

      const models = ["gemini-3.5-flash", "gemini-3.6-flash"];
      let response: any = null;
      let lastErrorText = "";

      for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        try {
          response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              }
            })
          });

          if (response.ok) {
            break;
          } else {
            lastErrorText = await response.text();
            console.warn(`Gemini call failed for ${model}:`, lastErrorText);
          }
        } catch (fetchErr: any) {
          lastErrorText = fetchErr.message;
          console.warn(`Gemini fetch error for ${model}:`, fetchErr);
        }
      }

      if (!response || !response.ok) {
        console.error("All Gemini models failed. Last error:", lastErrorText);
        return {
          reply: "Xin lỗi, máy chủ AI của Google đang quá tải hoặc gặp sự cố tạm thời. Bạn vui lòng thử lại sau giây lát nhé!"
        };
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Tôi không tìm thấy câu trả lời phù hợp. Bạn cần giúp gì thêm không?";
      return { reply };
    } catch (error) {
      console.error("Error in AI Consultation:", error);
      return {
        reply: "Có lỗi xảy ra trong quá trình xử lý tư vấn AI. Vui lòng thử lại sau!"
      };
    }
  }
}
