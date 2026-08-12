const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// Bot Token của Bảo
const BOT_TOKEN = "3263910569141341001:kjGtgFCljEbwEJlJUIKkKHNuIWZCpEgCmdzbOUvbVPjcICXgatLDPvJvENFUkWIk";

// Danh sách từ khóa trả lời tự động
const customResponses = {
  "tn": "Bạn ấn vào tên nhóm,rồi vào ô tìm kiếm:nhập[tn] nha",
  "caothuc": "Bạn ấn vào tên nhóm,rồi vào ô tìm kiếm:nhập [caothuc] nha🥰",
  "quoc dinh": "Bạn ấn vào tên nhóm,rồi vào ô tìm kiếm:nhập [quoc dinh] nha🥰",
  "bach chien": "Bạn ấn vào tên nhóm,rồi vào ô tìm kiếm:nhập [bach chien] nha🥰",
  "hl": "Bạn ấn vào tên nhóm,rồi vào ô tìm kiếm:nhập [hl]",
  "van tri": "Bạn ấn vào tên nhóm,rồi vào ô tìm kiếm:nhập [van tri] nha🥰",
  "damcuoi": "Bạn ấn vào tên nhóm,rồi vào ô tìm kiếm:[caothuc] vs [quocdinh] nha🥰",
};

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot Zalo BAO WEDJ đang chạy ngon lành!');
});

app.get('/webhook', (req, res) => {
  res.status(200).send(req.query.challenge || 'OK');
});

// Hàm gửi tin nhắn chuẩn API Zalo Bot Platform
async function sendBotMessage(chatId, text) {
  try {
    // Endpoint chuẩn chính thức từ tài liệu Zalo Bot
    const url = `https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`;

    const response = await axios.post(url, {
      chat_id: String(chatId),
      text: text
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("--> Đã gửi tin thành công:", response.data);
  } catch (err) {
    console.error('Lỗi gửi tin:', err.response ? err.response.data : err.message);
  }
}

app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');

  const data = req.body;
  // Xử lý dữ liệu webhook từ Zalo Bot
  const result = data.result || data;
  
  const senderId = result.from?.id || result.message?.from?.id;
  const senderName = result.from?.display_name || result.message?.from?.display_name || 'Bạn';
  const chatId = result.chat?.id || result.message?.chat?.id || senderId;
  
  let rawText = result.message?.text || result.text || '';
  let text = rawText.toLowerCase().trim().replace(/@bot bao wedj/g, '').trim();

  if (chatId) {
    console.log(`[Tin nhắn từ ${senderName} (${senderId})]: ${text}`);

    if (text) {
      // 1. Lệnh xem ID
      if (text === "id" || text === "myid") {
        await sendBotMessage(chatId, `🆔 Chào ${senderName}, ID Zalo của bạn là: ${senderId}`);
        return;
      }

      // 2. Trả lời các từ khóa
      for (const key in customResponses) {
        if (text.includes(key)) {
          await sendBotMessage(chatId, customResponses[key]);
          return;
        }
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
