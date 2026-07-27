const fs = require('fs');
const path = require('path');

async function diagnose() {
  console.log('--- BẮT ĐẦU CHẨN ĐOÁN LỖI GEMINI API ---');
  
  // 1. Đọc file .env
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('LỖI: Không tìm thấy file .env ở thư mục backend!');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^GEMINI_API_KEY=(.*)$/m);
  if (!match) {
    console.error('LỖI: Không tìm thấy biến GEMINI_API_KEY trong file .env!');
    return;
  }
  
  const apiKey = match[1].trim();
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.error('LỖI: Bạn chưa thay thế khóa API của bạn vào file .env (vẫn đang là placeholder hoặc trống)!');
    return;
  }
  
  console.log('Đã đọc được GEMINI_API_KEY:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
  
  // 2. Gọi thử API với các model thế hệ mới
  const modelsToTest = ['gemini-3.5-flash', 'gemini-3.6-flash'];
  
  for (const model of modelsToTest) {
    console.log(`\nThử nghiệm với model: ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello, respond with success.' }] }]
        })
      });
      
      const responseText = await response.text();
      console.log(`HTTP Status: ${response.status}`);
      
      if (response.ok) {
        console.log(`=> THÀNH CÔNG: Model ${model} hoạt động bình thường!`);
        try {
          const json = JSON.parse(responseText);
          console.log('Phản hồi từ AI:', json.candidates[0].content.parts[0].text.trim());
        } catch (e) {}
      } else {
        console.error(`=> THẤT BẠI: Lỗi từ máy chủ Google cho model ${model}:`);
        console.error(responseText);
      }
    } catch (error) {
      console.error(`=> LỖI KẾT NỐI MẠNG: Không thể gửi yêu cầu đến Google API cho ${model}:`, error.message);
    }
  }
  
  console.log('\n--- KẾT THÚC CHẨN ĐOÁN ---');
}

diagnose();
