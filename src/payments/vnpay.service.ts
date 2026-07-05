import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { OrdersService } from "../orders/orders.service";

type VnpayParams = Record<string, string>;

function encode(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function buildQuery(params: VnpayParams) {
  return Object.keys(params)
    .filter((key) => params[key] !== "")
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join("&");
}

function formatVnpayDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}${value("month")}${value("day")}${value("hour")}${value("minute")}${value("second")}`;
}

@Injectable()
export class VnpayService {
  constructor(
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService
  ) {}

  private credentials() {
    const tmnCode = this.config.get<string>("VNPAY_TMN_CODE")?.trim();
    const hashSecret = this.config.get<string>("VNPAY_HASH_SECRET")?.trim();
    if (!tmnCode || !hashSecret) {
      throw new ServiceUnavailableException("VNPay is not configured. Set VNPAY_TMN_CODE and VNPAY_HASH_SECRET.");
    }
    return { tmnCode, hashSecret };
  }

  private sign(params: VnpayParams, secret: string) {
    return createHmac("sha512", secret).update(buildQuery(params), "utf8").digest("hex");
  }

  async createPaymentUrl(orderId: string, paymentToken: string, ipAddress: string) {
    const { tmnCode, hashSecret } = this.credentials();
    const order = await this.ordersService.getOrderForPayment(orderId, paymentToken);
    if (!order) throw new NotFoundException("Order or payment token is invalid");
    if (order.paymentMethod !== "vnpay") throw new BadRequestException("This order does not use VNPay");
    if (order.paymentStatus === "paid") throw new BadRequestException("Order has already been paid");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    const returnUrl = this.config.get<string>("VNPAY_RETURN_URL") || "http://localhost:3000/checkout/vnpay-return";
    const params: VnpayParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(Math.round(order.total * 100)),
      vnp_CurrCode: "VND",
      vnp_TxnRef: String(order._id),
      vnp_OrderInfo: `Thanh toan don hang ${String(order._id)}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddress || "127.0.0.1",
      vnp_CreateDate: formatVnpayDate(now),
      vnp_ExpireDate: formatVnpayDate(expiresAt)
    };
    const secureHash = this.sign(params, hashSecret);
    const paymentUrl = this.config.get<string>("VNPAY_PAYMENT_URL") || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    return { paymentUrl: `${paymentUrl}?${buildQuery(params)}&vnp_SecureHash=${secureHash}` };
  }

  private normalizeQuery(query: Record<string, unknown>) {
    const params: VnpayParams = {};
    Object.entries(query).forEach(([key, value]) => {
      if (key.startsWith("vnp_") && typeof value === "string" && value) params[key] = value;
    });
    return params;
  }

  async verifyAndUpdate(query: Record<string, unknown>) {
    const { tmnCode, hashSecret } = this.credentials();
    const params = this.normalizeQuery(query);
    const receivedHash = params.vnp_SecureHash || "";
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;
    const expectedHash = this.sign(params, hashSecret);
    const validSignature = receivedHash.length === expectedHash.length && timingSafeEqual(
      Buffer.from(receivedHash, "utf8"), Buffer.from(expectedHash, "utf8")
    );
    if (!validSignature || params.vnp_TmnCode !== tmnCode) {
      return { valid: false, success: false, code: "97", message: "Invalid signature" };
    }

    const order = await this.ordersService.getOrderForPaymentCallback(params.vnp_TxnRef);
    if (!order) return { valid: true, success: false, code: "01", message: "Order not found" };
    if (String(Math.round(order.total * 100)) !== params.vnp_Amount) {
      return { valid: true, success: false, code: "04", message: "Invalid amount", orderId: String(order._id) };
    }

    const success = params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00";
    const alreadyProcessed = order.paymentStatus === "paid" || (order.paymentStatus === "failed" && !success);
    if (!alreadyProcessed) {
      await this.ordersService.updatePaymentResult(String(order._id), {
        paymentStatus: success ? "paid" : "failed",
        paymentTransactionNo: params.vnp_TransactionNo,
        paymentResponseCode: params.vnp_ResponseCode,
        paidAt: success ? new Date() : undefined
      });
    }
    return {
      valid: true,
      success: order.paymentStatus === "paid" || success,
      alreadyProcessed,
      code: alreadyProcessed ? "02" : "00",
      message: alreadyProcessed ? "Order already confirmed" : "Confirm success",
      orderId: String(order._id),
      transactionNo: params.vnp_TransactionNo,
      responseCode: params.vnp_ResponseCode
    };
  }
}
