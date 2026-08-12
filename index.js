const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// Token Zalo Bot của Bảo
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
async function sendBotMessage(chatId, text, messageId = null) {
  try {
    const payload = {
      chat_id: chatId,
      text: text
    };

    // Nếu có messageId thì reply trực tiếp vào tin nhắn đó
    if (messageId) {
      payload.reply_to_message_id = messageId;
    }

    const response = await axios.post('https://bot-api.zalo.me/v1/message/send', payload, {
      headers: {
        'bot-token': BOT_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    console.log("--> Đã gửi tin nhắn thành công:", response.data);
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
  const chatId = data.chat?.id; // ID nhóm hoặc ID user
  const msgId = data.message_id;
  
  // Tự động xoá chữ @Bot BAO WEDJ
  let text = (data.message?.text || '').toLowerCase().trim();
  text = text.replace(/@bot bao wedj/g, '').trim();

  console.log(`[Tin nhắn từ ${senderName} (${senderId})]: ${text}`);

  if (text) {
    // 1. Lệnh id
    if (text === "id" || text === "myid") {
      await sendBotMessage(chatId, `🆔 Chào ${senderName}, ID Zalo của bạn là: ${senderId}`, msgId);
      return;
    }

    // 2. Trả lời từ khóa
    for (const key in customResponses) {
      if (text.includes(key)) {
        await sendBotMessage(chatId, customResponses[key], msgId);
        return;
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
