const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

const BOT_TOKEN = "3263910569141341001:SMJQmRxwmpZOZYQyicuJEAfkJbSMMhGWASvjSIXjrtGzDnSDBJheQUYAfegQEvgY";

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot Zalo BAO WEDJ đang chạy!');
});

// Endpoint trả về xác thực cho Zalo
app.get('/webhook', (req, res) => {
  console.log("--> Zalo đang kiểm tra Webhook GET request");
  res.status(200).send(req.query.challenge || 'OK');
});

// Endpoint nhận tin nhắn từ Zalo
app.post('/webhook', async (req, res) => {
  console.log("==========================================");
  console.log("--> CÓ DỮ LIỆU TỪ ZALO GỬI VỀ:", JSON.stringify(req.body));
  console.log("==========================================");

  // Trả về 200 ngay lập tức để Zalo không báo lỗi Timeout
  res.status(200).send('OK');

  const data = req.body;
  if (!data) return;

  const groupId = data.recipient?.group_id || data.sender?.id || data.group_id;
  const senderId = data.sender?.id || data.user_id;
  const text = data.message?.text ? data.message.text.toLowerCase().trim() : '';

  if (groupId && text) {
    try {
      let replyText = "";
      if (text === "id" || text === "myid") {
        replyText = `🆔 ID Zalo của bạn là: ${senderId}`;
      } else if (text === "tn") {
        replyText = "Thông tin về TN";
      } else if (text === "dk") {
        replyText = "Đã nhận lệnh DK";
      }

      if (replyText) {
        await axios.post(`https://openapi.zalo.me/v2.0/oa/group/message?access_token=${BOT_TOKEN}`, {
          recipient: { group_id: groupId },
          message: { text: replyText }
        });
      }
    } catch (err) {
      console.error("Lỗi gửi tin:", err.response?.data || err.message);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
