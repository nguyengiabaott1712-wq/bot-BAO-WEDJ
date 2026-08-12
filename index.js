const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// Bot Token đầy đủ của bạn
const BOT_TOKEN = "3263910569141341001:SMJQmRxwmpZOZYQyicuJEAfkJbSMMhGWASvjSIXjrtGzDnSDBJheQUYAfegQEvgY";

// DANH SÁCH ID BẢO MẬT (Để tạm mảng rỗng để bot nhận lệnh của tất cả mọi người)
const ADMIN_IDS = [];

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
  res.send('Bot Zalo BAO WEDJ đang chạy!');
});

async function sendMessage(threadId, text, isGroup = true) {
  try {
    const endpoint = isGroup 
      ? `https://openapi.zalo.me/v2.0/oa/group/message?access_token=${BOT_TOKEN}`
      : `https://openapi.zalo.me/v2.0/oa/message?access_token=${BOT_TOKEN}`;

    const recipient = isGroup ? { group_id: threadId } : { user_id: threadId };

    await axios.post(endpoint, {
      recipient: recipient,
      message: { text: text }
    });
  } catch (err) {
    console.error('Lỗi gửi tin:', err.response ? err.response.data : err.message);
  }
}

app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');

  const data = req.body;
  if (!data) return;

  const groupId = data.recipient?.group_id || data.sender?.id;
  const senderId = data.sender?.id;
  const text = data.message?.text ? data.message.text.toLowerCase().trim() : '';

  console.log(`[Tin nhắn từ ID: ${senderId}] Nội dung: ${text}`);

  if (text) {
    // 1. Gõ "id" -> Bot báo ngay ID Zalo của người nhắn
    if (text === "id" || text === "myid") {
      await sendMessage(groupId, `🆔 ID Zalo của bạn là: ${senderId}`);
      return;
    }

    // 2. Phản hồi các từ khóa
    for (const key in customResponses) {
      if (text.includes(key)) {
        await sendMessage(groupId, customResponses[key]);
        return;
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
