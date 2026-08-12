const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

const BOT_TOKEN = "3263910569141341001:SMJQmRxwmpZOZYQyicuJEAfkJbSMMhGWASvjSIXjrtGzDnSDBJheQUYAfegQEvgY";

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
  res.send('Bot Zalo BAO WEDJ đang chạy!');
});

app.get('/webhook', (req, res) => {
  res.status(200).send(req.query.challenge || 'OK');
});

// Hàm gửi tin nhắn phản hồi
async function sendMessage(threadId, text, isGroup = true) {
  try {
    const endpoint = isGroup 
      ? `https://openapi.zalo.me/v2.0/oa/group/message?access_token=${BOT_TOKEN}`
      : `https://openapi.zalo.me/v2.0/oa/message?access_token=${BOT_TOKEN}`;

    const recipient = isGroup ? { group_id: threadId } : { user_id: threadId };

    const response = await axios.post(endpoint, {
      recipient: recipient,
      message: { text: text }
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

  // Lấy dữ liệu chuẩn theo định dạng Zalo
  const senderId = data.from?.id;
  const senderName = data.from?.display_name || 'Bạn';
  const groupId = data.chat?.id;
  const isGroup = data.chat?.chat_type === "GROUP";
  
  // Tự động cắt bỏ phần tag @Bot BAO WEDJ
  let text = (data.message?.text || '').toLowerCase().trim();
  text = text.replace(/@bot bao wedj/g, '').trim();

  const targetId = isGroup ? groupId : senderId;

  console.log(`[Tin nhắn từ ${senderName} (${senderId})]: ${text}`);

  if (text) {
    // 1. Lệnh xem ID Zalo cá nhân
    if (text === "id" || text === "myid") {
      await sendMessage(targetId, `🆔 Chào ${senderName}, ID Zalo của bạn là: ${senderId}`, isGroup);
      return;
    }

    // 2. Phản hồi các từ khóa cài đặt sẵn
    for (const key in customResponses) {
      if (text.includes(key)) {
        await sendMessage(targetId, customResponses[key], isGroup);
        return;
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
