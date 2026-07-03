const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Simple helper to parse .env file
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    console.error("Không tìm thấy file .env tại:", envPath);
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars = {};
  
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.replace(/^"|"\s*$/g, "");
      }
      envVars[key] = value.trim();
    }
  });
  return envVars;
}

async function promote() {
  const uid = process.argv[2];
  if (!uid) {
    console.error("Vui lòng cung cấp UID người dùng cần thăng cấp Admin.");
    console.error("Ví dụ: node promote-admin.js <USER_UID>");
    process.exit(1);
  }

  const env = loadEnv();
  const mongoUri = env.MONGODB_URI || "mongodb://localhost:27017/shoes_db";

  console.log("Đang kết nối tới MongoDB...");
  try {
    await mongoose.connect(mongoUri);
    console.log("Kết nối MongoDB thành công.");

    // Define User Schema inline
    const UserSchema = new mongoose.Schema({
      uid: { type: String, required: true },
      email: String,
      displayName: String,
      isAdmin: { type: Boolean, default: false }
    }, { collection: "users" });

    const User = mongoose.model("User", UserSchema);

    const user = await User.findOne({ uid });
    if (!user) {
      console.error(`Không tìm thấy người dùng có UID: "${uid}" trong database.`);
      console.log("Hãy đảm bảo người dùng đã đăng nhập vào trang web ít nhất một lần để đồng bộ profile.");
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();

    console.log(`\n🎉 THĂNG CẤP THÀNH CÔNG!`);
    console.log(`- Tên: ${user.displayName || "Chưa thiết lập"}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- UID: ${user.uid}`);
    console.log(`- Quyền hạn: Admin (isAdmin = true)`);

  } catch (error) {
    console.error("Lỗi khi kết nối hoặc cập nhật database:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nĐã ngắt kết nối MongoDB.");
  }
}

promote();
