# VNPay sandbox configuration

Add these values to `APISHOES/.env`:

```env
VNPAY_TMN_CODE=your_sandbox_tmn_code
VNPAY_HASH_SECRET=your_sandbox_hash_secret
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/checkout/vnpay-return
```

Register sandbox credentials at https://sandbox.vnpayment.vn/devreg/.

For production, replace the payment and return URLs with the production values supplied by VNPay. Configure the merchant IPN URL as:

```text
https://your-api-domain/api/payments/vnpay/ipn
```

VNPay requires a public HTTPS URL for IPN; `localhost` can only be used for the browser Return URL during local development.
