const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// Token Bot Zalo của Bảo
const BOT_TOKEN = "3263910569141341001:kjGtgFCljEbwEJlJUIKkKHNuIWZCpEgCmdzbOUvbVPjcICXgatLDPvJvENFUkWIk";

// Danh sách từ khóa trả lời tự động
const customResponses = {
  "tn": "Thông tin về TN: [Nội dung TN]",
  "caothuc": "Thông tin về Cao Thức: [Nội dung Cao Thức]",
  "quoc dinh": "Thông tin về Quốc Định: [Nội dung Quốc Định]",
  "bach chien": "Thông tin về Bách Chiến: [Nội dung Bách Chiến]",
  "hl": "Thông tin về HL: [Nội dung HL]",
  "van tri": "Thông tin về Văn Trí: [Nội dung Văn Trí]"
};

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot Zalo BAO WEDJ đang hoạt động!');
});

app.get('/webhook', (req, res) => {
  res.status(200).send(req.query.challenge || 'OK');
});

// Hàm gửi tin nhắn chuẩn API Zalo Bot Platform
async function sendBotMessage(chatId, text, isGroup = true) {
  try {
    const url = "https://bot-platform.zalo.me/v1/message";

    const payload = {
      chat_id: chatId,
      message: {
        text: text
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'token': BOT_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    console.log("--> Kết quả gửi tin:", response.data);
  } catch (err) {
    console.error('Lỗi gửi tin:', err.response ? err.response.data : err.message);
  }
}

app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');

  const data = req.body;
  if (!data || data.event_name !== "message.text.received") return;

  const senderId = data.from?.id;
  const senderName = data.from?.display_name || 'Bạn';
  const groupId = data.chat?.id;
  const isGroup = data.chat?.chat_type === "GROUP";
  
  // Tự động xoá chữ @Bot BAO WEDJ
  let text = (data.message?.text || '').toLowerCase().trim();
  text = text.replace(/@bot bao wedj/g, '').trim();

  const targetId = isGroup ? groupId : senderId;

  console.log(`[Tin nhắn từ ${senderName} (${senderId})]: ${text}`);

  if (text) {
    // 1. Lệnh id
    if (text === "id" || text === "myid") {
      await sendBotMessage(targetId, `🆔 Chào ${senderName}, ID Zalo của bạn là: ${senderId}`, isGroup);
      return;
    }

    // 2. Trả lời từ khóa
    for (const key in customResponses) {
      if (text.includes(key)) {
        await sendBotMessage(targetId, customResponses[key], isGroup);
        return;
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
